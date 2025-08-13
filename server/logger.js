const mysql = require('mysql2');
const dbConfig = require('./db-config');

class Logger {
  constructor() {
    // สร้าง connection pool
    this.pool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      acquireTimeout: 60000,
      timeout: 60000
    });

    // สร้าง promisified version
    this.promisePool = this.pool.promise();
    
  }

  async initDatabase() {
    try {
      // ลองเชื่อมต่อกับ database
      await this.promisePool.execute('SELECT 1');
      
      // สร้างฐานข้อมูลถ้ายังไม่มี
      await this.promisePool.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
      
      // สร้างตาราง sessions สำหรับเก็บข้อมูลการเชื่อมต่อ
      await this.promisePool.execute(`
        CREATE TABLE IF NOT EXISTS sessions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          session_id VARCHAR(255) UNIQUE NOT NULL,
          room_id VARCHAR(255) NOT NULL,
          role ENUM('sender', 'viewer') NOT NULL,
          ip_address VARCHAR(45),
          user_agent TEXT,
          connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          disconnected_at TIMESTAMP NULL,
          duration_seconds INT DEFAULT NULL,
          status ENUM('active', 'disconnected') DEFAULT 'active',
          INDEX idx_room_id (room_id),
          INDEX idx_connected_at (connected_at),
          INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // สร้างตาราง events สำหรับเก็บ events ต่างๆ
      await this.promisePool.execute(`
        CREATE TABLE IF NOT EXISTS events (
          id INT AUTO_INCREMENT PRIMARY KEY,
          session_id VARCHAR(255) NOT NULL,
          event_type VARCHAR(100) NOT NULL,
          event_data JSON,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_session_id (session_id),
          INDEX idx_timestamp (timestamp),
          INDEX idx_event_type (event_type),
          FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // สร้างตาราง room_stats สำหรับสถิติห้อง
      await this.promisePool.execute(`
        CREATE TABLE IF NOT EXISTS room_stats (
          id INT AUTO_INCREMENT PRIMARY KEY,
          room_id VARCHAR(255) UNIQUE NOT NULL,
          total_sessions INT DEFAULT 0,
          peak_concurrent INT DEFAULT 0,
          total_duration_minutes INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_room_id (room_id),
          INDEX idx_total_sessions (total_sessions)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      this.connected = true;
      console.log(`📊 MySQL Database initialized successfully`);
    } catch (error) {
      console.warn('⚠️ MySQL not available, running without database logging:', error.message);
      this.connected = false;
      // ไม่ throw error เพื่อให้ server ทำงานต่อได้
    }
  }

  // บันทึกการเชื่อมต่อใหม่
  async logConnection(sessionId, roomId, role, ipAddress, userAgent) {
    try {
      await this.promisePool.execute(`
        INSERT INTO sessions 
        (session_id, room_id, role, ip_address, user_agent, connected_at, status)
        VALUES (?, ?, ?, ?, ?, NOW(), 'active')
        ON DUPLICATE KEY UPDATE 
        connected_at = NOW(), status = 'active'
      `, [sessionId, roomId, role, ipAddress, userAgent]);
      
      console.log(`📊 Logged connection: ${sessionId} (${role}) in room ${roomId}`);
      
      // อัพเดทสถิติห้อง
      await this.updateRoomStats(roomId);
    } catch (error) {
      console.error('❌ Failed to log connection:', error);
    }
  }

  // บันทึกการตัดการเชื่อมต่อ
  async logDisconnection(sessionId) {
    try {
      await this.promisePool.execute(`
        UPDATE sessions 
        SET disconnected_at = NOW(),
            duration_seconds = TIMESTAMPDIFF(SECOND, connected_at, NOW()),
            status = 'disconnected'
        WHERE session_id = ? AND status = 'active'
      `, [sessionId]);
      
      console.log(`📊 Logged disconnection: ${sessionId}`);
    } catch (error) {
      console.error('❌ Failed to log disconnection:', error);
    }
  }

  // บันทึก events ต่างๆ
  async logEvent(sessionId, eventType, eventData = null) {
    try {
      await this.promisePool.execute(`
        INSERT INTO events (session_id, event_type, event_data, timestamp)
        VALUES (?, ?, ?, NOW())
      `, [sessionId, eventType, eventData ? JSON.stringify(eventData) : null]);
    } catch (error) {
      console.error('❌ Failed to log event:', error);
    }
  }

  // อัพเดทสถิติห้อง
  async updateRoomStats(roomId) {
    try {
      // นับจำนวน session ที่ active ในห้อง
      const [rows] = await this.promisePool.execute(`
        SELECT COUNT(*) as concurrent FROM sessions 
        WHERE room_id = ? AND status = 'active'
      `, [roomId]);

      const concurrent = rows[0].concurrent;

      // อัพเดทหรือสร้างสถิติห้อง
      await this.promisePool.execute(`
        INSERT INTO room_stats (room_id, total_sessions, peak_concurrent, updated_at)
        VALUES (?, 1, ?, NOW())
        ON DUPLICATE KEY UPDATE 
        total_sessions = total_sessions + 1,
        peak_concurrent = GREATEST(peak_concurrent, ?),
        updated_at = NOW()
      `, [roomId, concurrent, concurrent]);
    } catch (error) {
      console.error('❌ Failed to update room stats:', error);
    }
  }

  // ดึงสถิติรายวัน
  async getDailyStats() {
    try {
      const [rows] = await this.promisePool.execute(`
        SELECT 
          DATE(connected_at) as date,
          COUNT(*) as total_connections,
          COUNT(DISTINCT room_id) as unique_rooms,
          SUM(CASE WHEN role = 'sender' THEN 1 ELSE 0 END) as senders,
          SUM(CASE WHEN role = 'viewer' THEN 1 ELSE 0 END) as viewers,
          ROUND(AVG(duration_seconds), 2) as avg_duration
        FROM sessions 
        WHERE connected_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(connected_at)
        ORDER BY date DESC
      `);
      return rows;
    } catch (error) {
      console.error('❌ Failed to get daily stats:', error);
      return [];
    }
  }

  // ดึงสถิติห้องยอดนิยม
  async getPopularRooms(limit = 10) {
    try {
      const [rows] = await this.promisePool.execute(`
        SELECT 
          room_id,
          total_sessions,
          peak_concurrent,
          total_duration_minutes,
          updated_at
        FROM room_stats 
        ORDER BY total_sessions DESC 
        LIMIT ?
      `, [limit]);
      return rows;
    } catch (error) {
      console.error('❌ Failed to get popular rooms:', error);
      return [];
    }
  }

  // ดึงการเชื่อมต่อล่าสุด
  async getRecentConnections(limit = 50) {
    try {
      const [rows] = await this.promisePool.execute(`
        SELECT 
          session_id,
          room_id,
          role,
          ip_address,
          connected_at,
          disconnected_at,
          duration_seconds,
          status
        FROM sessions 
        ORDER BY connected_at DESC 
        LIMIT ?
      `, [limit]);
      return rows;
    } catch (error) {
      console.error('❌ Failed to get recent connections:', error);
      return [];
    }
  }

  // ดึงสถิติรวม
  async getOverallStats() {
    try {
      const [stats] = await this.promisePool.execute(`
        SELECT 
          COUNT(*) as total_sessions,
          COUNT(DISTINCT room_id) as total_rooms,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_sessions,
          ROUND(AVG(duration_seconds), 2) as avg_session_duration,
          MAX(connected_at) as last_connection
        FROM sessions
      `);
      return stats[0];
    } catch (error) {
      console.error('❌ Failed to get overall stats:', error);
      return {};
    }
  }

  // ปิด database connection
  async close() {
    try {
      await this.promisePool.end();
      console.log('📊 MySQL connection pool closed');
    } catch (error) {
      console.error('❌ Error closing MySQL connection pool:', error);
    }
  }
}

module.exports = Logger;
