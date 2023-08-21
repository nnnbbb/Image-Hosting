git pull
npm i 
pm2 delete Image-Hosting
export NODE_ENV=production && pm2 start index.js -i 2 --name=Image-Hosting --log-date-format "YYYY-MM-DD HH:mm:ss"
pm2 logs Image-Hosting
