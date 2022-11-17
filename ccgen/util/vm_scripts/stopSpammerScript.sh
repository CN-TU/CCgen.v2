#!/bin/bash
cd $0
sudo -u $(logname) vagrant ssh -c "sudo systemctl stop spammer"