#!/bin/bash 

if [ $# -eq 0 ]
  then
    SPAMMER_DIR="$(dirname "$(pwd)")"
else
    SPAMMER_DIR=$1
fi
KEY_DIR=$SPAMMER_DIR/.vagrant/machines/default/virtualbox
SSH_PORT=2222
ssh -i $KEY_DIR/private_key -o PasswordAuthentication=no vagrant@127.0.0.1 -p $SSH_PORT
