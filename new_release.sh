echo $(pwd)

#create tmp directory and copy all files
mkdir release/tmp
cp -r ccgen  release/tmp
mkdir release/tmp/configs
cp -r docs release/tmp
cp -r listener release/tmp
mkdir release/tmp/messages
mkdir release/tmp/out
mkdir release/tmp/pcaps
cp -r spammer release/tmp
cp install.sh release/tmp
cp LICENSE release/tmp
cp README.md release/tmp
cp requirements.txt release/tmp
cp run.sh release/tmp

#remove unnecessary files
rm -r release/tmp/ccgen/__pycache__/
rm -r release/tmp/ccgen/data/*
cp ccgen/data/ccgen_data_default.db release/tmp/ccgen/data/ccgen_data.db
rm -r release/tmp/ccgen/util/__pycache__/
rm -r release/tmp/ccgen/wrapper/__pycache__/
rm -r release/tmp/ccgen/wrapper/go-flows-master/*
rm -r release/tmp/ccgen/wrapper/temp/*
rm -r release/tmp/listener/__pycache__/
cp messages/example.txt release/tmp/messages/
cp pcaps/empty.pcap release/tmp/pcaps/
rm -r release/tmp/spammer/__pycache__/
rm -r release/tmp/spammer/.vagrant
rm -r release/tmp/spammer/Vagrantfile

#create tar.gz
CODE=$(date +%s)
cd release/tmp
tar -czvf $(pwd)/../CCgen.v2_$CODE.tar.gz * 

#remove tmp folder
rm -r ../tmp