location / {
    root /srv/dk/frontend/current;
try_files $uri /index.html;
}

location /api/ {
    proxy_pass http://127.0.0.1:3000;
}

location /ws {
    proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
