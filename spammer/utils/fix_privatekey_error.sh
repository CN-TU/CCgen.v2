CUR_KEY_DIR=$(pwd)/.vagrant/machines/default/virtualbox
KEY_DIR=$HOME/vagrant_keys

if [ ! -d "$KEY_DIR" ]; then
  mkdir $KEY_DIR
fi

mv $CUR_KEY_DIR/private_key $KEY_DIR
ln -s $KEY_DIR/private_key $CUR_KEY_DIR/private_key