#!/bin/bash
cd $0
sudo -u $(logname) vagrant ssh -c "ifconfig | grep 'inet '"