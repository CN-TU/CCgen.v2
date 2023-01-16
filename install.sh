#!/bin/bash
printf 'Do you wanna also install the CCgen.v2 online mode? (y/n)?\n\tYou can do it later, be re-running this installer.\n\tNot recommended on virtual machines! '
read answer

INSTALL_DIR=$(pwd)

sudo apt update

#install required linux packages
sudo apt install python3 -y
sudo apt install python3-pip -y
sudo apt install xterm -y
sudo apt install git -y

#install python packages
sudo pip install -r $INSTALL_DIR/requirements.txt

if [ "$answer" != "${answer#[Yy]}" ] ;
then
#check if virtualbox is installed
    VIRTUALBOX_VERSION=$(vboxmanage --version)
    if [ -z "$VIRTUALBOX_VERSION" ]
    then 
        echo "Please install virtualbox version compatible to vagrant! (e.g. 6.1)"
        exit 1
    fi
    cd $INSTALL_DIR/spammer

    sudo apt install iptables -y
    sudo apt install vagrant -y

    #create Vagrantfile
    NET_ADAPTER=$(ip route | grep default | sed -e "s/^.*dev.//" -e "s/.proto.*//")
    echo 'Create Vagrantfile with '$NET_ADAPTER' as network adapter.'

    echo '# -*- mode: ruby -*-' > Vagrantfile
    echo '# vi: set ft=ruby :' >> Vagrantfile
    echo '' >> Vagrantfile
    echo 'Vagrant.configure("2") do |config|' >> Vagrantfile
    echo '  config.vm.box = "fedora/36-cloud-base"' >> Vagrantfile
    echo '  config.vm.network "public_network", bridge: "'$NET_ADAPTER'"' >> Vagrantfile
    echo '  config.vm.synced_folder ".", "/vagrant", type: "rsync",' >> Vagrantfile
    echo '    rsync__exclude: ["utils/", "Vagrantfile"]' >> Vagrantfile
    echo '  config.vm.provider "virtualbox" do |v|' >> Vagrantfile
    echo '    v.memory = 2048' >> Vagrantfile
    echo '    v.cpus = 2' >> Vagrantfile
    echo '  end' >> Vagrantfile
    echo '  config.vm.provision "shell", path: "utils/spammer_script.sh"' >> Vagrantfile
    echo 'end' >> Vagrantfile

    #install spammerVM
    sudo -u $(logname) vagrant up --provision
fi

#add database if no database exists
FILE=$INSTALL_DIR/ccgen/data/ccgen_data.db
if [ -f "$FILE" ]; then
    echo "$FILE exists."
else
    cp $INSTALL_DIR/ccgen/data/ccgen_data_default.db $INSTALL_DIR/ccgen/data/ccgen_data.db
fi

#create configs folder
mkdir $INSTALL_DIR/configs

#finished
echo "Successfully installed CCgen.v2!"
echo "To use the wrapper, go-flows is required. Check out the README file in ccgen/wrapper/ folder in order to know how to install go-flows."
