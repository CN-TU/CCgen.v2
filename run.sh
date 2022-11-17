
#!/usr/bin/env bash

printf 'Do you wanna start with online mode (y/n)? '
read answer

if [ "$answer" != "${answer#[Yy]}" ] ;
then
    #sudo -u $(logname) xdg-open http://localhost:5000 &
    sudo python3 ccgen/app.py
else
    #xdg-open http://localhost:5000 &
    python3 ccgen/app.py
fi
