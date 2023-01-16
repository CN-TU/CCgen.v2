import os, re
from bitstring import BitArray
from pathlib import Path
import json, datetime

OUT_FOLDER = str(Path(__file__).parent.parent.parent.absolute()) + "/out"
PCAP_FOLDER = str(Path(__file__).parent.parent.parent.absolute()) + "/pcaps"
TECHNIQUE_FOLDER = str(Path(__file__).parent.parent.absolute()) + "/techniques"
SPAMMER_CONFIG_PATH = str(Path(__file__).parent.parent.parent.absolute()) + "/spammer/spammer.ini"
DB_PATH = str(Path(__file__).parent.parent.absolute()) + "/data/ccgen_data.db"
CONFIG_PATH = str(Path(__file__).parent.parent.parent.absolute()) + "/configs"

def getUserId(cmd):
    process = os.popen(cmd)
    uid = int(process.read().strip())
    return uid

UID = getUserId("sudo -u $(logname) id -u")
GID = UID
IsSuperUser = getUserId("id -u") == 0

def isParentDirectory(path):
    parent = Path(path).parent.absolute()
    isdirectory = False
    if Path(parent).is_dir(): return True 
    return False

def isFile(path):
    if Path(path).is_file(): return True
    return False

def makeFileAccessible(network, output_file):
    if network != "offline": return
    os.chown(output_file, UID, GID)

def getMessageFromFile(message_file):
    message = ""
    extension = message_file.split(".")[-1]
    if extension == "txt" or extension == "csv":
        with open(message_file, "r") as f:
            message = f.read()
            f.close()
    elif extension == "zip":
        message = zip2bin(message_file)

    return message

def zip2bin(zip_file):
    zip_bits = ""
    with open(zip_file, "rb") as zip:
        while (byte := zip.read(1)):
            zip_bits += BitArray(byte).bin
        zip.close()

    return zip_bits

def text2bin(text):
    if re.match("^[01]+$", text.strip()): return text.strip()
    arrC = list(text)
    sym = list(map(lambda a: ord(a), arrC))
    sbi = list(map(lambda a: '{:08b}'.format(a), sym))
    return ''.join(sbi)

def getOutputFile(output_file, output_type):
    output = ""
    if output_type == "txt":
        output = bin2text(None, output_file)
    elif output_type == "csv":
        output = bin2text(None, output_file)
        with open(output_file.replace(".txt", "." + output_type), "w") as f:
            f.write(output)
        os.remove(output_file)
    elif output_type == "zip":
        output = bin2zip(output_file)
        os.remove(output_file)
    return output

def bin2text(input_sequence, input_file=None):
    class Conversion():
        def __init__(self, text):
            self.n_ascii = len(text)
            self.text = text

    csize = 8

    if input_file:
        with open(input_file, "r") as f:
            input_sequence = f.read().strip()
            f.close()   
    
    conversions = []
    for i in range(8):
        text = ""
        bin_sequence = input_sequence[i:]
        while len(bin_sequence) >= 8:
            ascii_bits = "0b" + bin_sequence[:csize]
            ascii_int = int(ascii_bits, 2)
            if (ascii_int >= 32 and ascii_int <= 126) or ascii_int == 10 or ascii_int == 13: 
                letter = chr(ascii_int)
                text += letter        
            bin_sequence = bin_sequence[csize:]
        conversions.append(Conversion(text)) 
        if input_file and not "csv" in input_file:
            if (i == 0): mode = "w"
            else: mode = "a"
            with open(input_file, mode) as f:
                if len(text) > 0: f.write("[Variant " + str(i) + "]\n" + text + "\n\n")
                else: f.write("Variant " + str(i) + ":\n\{empty\}\n")
                f.close()

    conversions.sort(key=lambda x: x.n_ascii, reverse=True)        
    return conversions[0].text

def bin2zip(input_file):
    zip_bytes = bytearray()
    with open(input_file, "r") as textfile:
        while (bits := textfile.read(8)):
            byte = hex(int(bits, 2))[2:]
            if len(byte) == 1: byte = "0" + byte
            zip_bytes.extend(bytearray.fromhex(byte))
        textfile.close()

    new_filename = input_file.replace(".txt", ".zip")
    with open(new_filename, "wb") as zipfile:
        zipfile.write(zip_bytes)
        zipfile.close()

    return zip_bytes

def configToFile(data, filters, isWrapper=False, no=""):
    now = datetime.datetime.now()
    fname = "empty"
    if isWrapper:
        fname = CONFIG_PATH + "/" + now.strftime("%Y%m%d%H%M%S") + "_wrapper.json" 
    else:
        technique = data['mapping']['technique'].split(".")[0]
        direction = data['direction'][0:3]
        
        if filters:
            data['src_ip'] = filters['src_ip']
            data['src_port'] = filters['src_port']
            data['dst_ip'] = filters['dst_ip']
            data['dst_port'] = filters['dst_port']
            data['proto'] = filters['proto']

        fname = CONFIG_PATH + "/" + now.strftime("%Y%m%d%H%M%S") + "_" + technique + "_" + direction + "_" + no + ".json" 

    with open(fname, 'w') as f:
        json.dump(data, f)

    return fname