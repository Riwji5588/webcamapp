# คำสั่งติดตั้งและตั้งค่า Nginx สำหรับ cam.nattavipol.space

## ขั้นตอนที่ 1: ติดตั้ง Nginx และตั้งค่า HTTP
## 1. ติดตั้ง Nginx (ถ้ายังไม่มี)
sudo apt update
sudo apt install nginx -y

## 2. ลบ config เก่าที่อาจขัดแย้ง
sudo rm -f /etc/nginx/sites-enabled/default
sudo rm -f /etc/nginx/sites-enabled/cloud.nattavipol.space

## 3. สร้างไฟล์ config สำหรับ HTTP
sudo tee /etc/nginx/sites-available/cam.nattavipol.space > /dev/null << 'EOF'
# (copy เนื้อหาจากไฟล์ nginx-config ใหม่)
EOF

## 4. Enable site
sudo ln -s /etc/nginx/sites-available/cam.nattavipol.space /etc/nginx/sites-enabled/

## 5. ทดสอบ config
sudo nginx -t

## 6. รีสตาร์ท Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

## 7. ทดสอบ HTTP
curl -I http://cam.nattavipol.space

## ขั้นตอนที่ 2: เพิ่ม SSL (ทำหลังจาก HTTP ทำงานแล้ว)
## 8. ติดตั้ง Certbot
sudo apt install certbot python3-certbot-nginx -y

## 9. สร้าง SSL certificate (Certbot จะแก้ไข config อัตโนมัติ)
sudo certbot --nginx -d cam.nattavipol.space

## 10. ตั้งค่า auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

## 11. ตรวจสอบการทำงาน HTTPS
curl -I https://cam.nattavipol.space

## 12. เปิด firewall ports
sudo ufw allow 'Nginx Full'
sudo ufw allow ssh
sudo ufw enable

## 13. ตรวจสอบสุดท้าย
sudo systemctl status nginx
sudo certbot certificates
pm2 status
