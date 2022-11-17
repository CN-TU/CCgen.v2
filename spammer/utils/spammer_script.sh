#!/bin/bash
if [ -e /etc/systemd/system/spammer.service ]
then
    sudo systemctl start spammer
else
    sudo dnf install -y python-devel python-pip

    echo '[Unit]' > spammer.service
    echo 'Description=Spammer' >> spammer.service
    echo '[Service]' >> spammer.service
    echo 'ExecStart=/usr/bin/python3 /vagrant/spammer.py' >> spammer.service
    echo '[Install]' >> spammer.service
    echo 'WantedBy=multi-user.target' >> spammer.service

    sudo mv spammer.service /etc/systemd/system/
    sudo chmod 777 /etc/systemd/system/spammer.service
    restorecon /etc/systemd/system/spammer.service    
    sudo systemctl daemon-reload
    sudo systemctl start spammer
fi