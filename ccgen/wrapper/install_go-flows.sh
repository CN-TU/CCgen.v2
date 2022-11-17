#!/bin/bash

FILES_NO=$(ls -1q go-flows-master/ | wc -l)
CUR_DIR=$(pwd)

if [ $FILES_NO = 1 ] ;
then
    echo "It seems to be, that go-flows is already installed!"
    exit 1
fi

if [ $FILES_NO < 5 ] ;
then
    echo "Please download the source files from git first: https://github.com/CN-TU/go-flows"
    exit 1
else
    sudo apt install libpcap-dev -y
    sudo apt install golang-go -y
    cd go-flows-master
    go install
    rm -r *
    cd ..
    cp $HOME/go/bin/go-flows $CUR_DIR/go-flows-master/
    sudo rm -r $HOME/go
fi

