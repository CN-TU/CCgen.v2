import os
from pathlib import Path

OUT_FOLDER = str(Path(__file__).parent.parent.parent.absolute()) + "/out"
PCAP_FOLDER = str(Path(__file__).parent.parent.parent.absolute()) + "/pcaps"
TECHNIQUE_FOLDER = str(Path(__file__).parent.parent.absolute()) + "/techniques"
SPAMMER_CONFIG_PATH = str(Path(__file__).parent.parent.parent.absolute()) + "/spammer/spammer.ini"
DB_PATH = str(Path(__file__).parent.parent.absolute()) + "/data/ccgen_data.db"

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
    with open(message_file, "r") as f:
        message += f.read()
        f.close()
    return message

def text2bin(text):
    arrC = list(text)
    sym = list(map(lambda a: ord(a), arrC))
    sbi = list(map(lambda a: '{:08b}'.format(a), sym))
    return ''.join(sbi)

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
            if ascii_int >= 32 and ascii_int <= 126: 
                letter = chr(int(ascii_bits, 2))
                text += letter        
            bin_sequence = bin_sequence[csize:]
        conversions.append(Conversion(text)) 
        if input_file:
            if (i == 0): mode = "w"
            else: mode = "a"
            with open(input_file, mode) as f:
                if len(text) > 0: f.write("[Variant " + str(i) + "]\n" + text + "\n\n")
                else: f.write("Variant " + str(i) + ":\n\{empty\}\n")
                f.close()

    conversions.sort(key=lambda x: x.n_ascii, reverse=True)        
    return conversions[0].text

