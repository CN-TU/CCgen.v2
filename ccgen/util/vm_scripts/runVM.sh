#!/bin/bash
cd $0
sudo -u $(logname) vagrant $1 --provision