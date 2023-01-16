from collections import namedtuple

from util.mapping import Mapping
from util.message import Message
from util.helper import TECHNIQUE_FOLDER

NETWORK_OFFLINE = 'offline'
NETWORK_ONLINE = 'online'

DIRECTION_SEND = 'inject'
DIRECTION_RECEIVE = 'extract'


Config = namedtuple('Config',
    [
        'network',
        'direction',
        'input_file',
        'output_file',
        'outfile_type',
        'src_ip',
        'dst_ip',
        'src_port',
        'dst_port',
        'proto',
        'mapping',
        'layer',
        'message',
        'technique',
        'iptables_chain',
        'iptables_queue',
    ]
)


def parse_config(configfile, user_message, direction, network):

    print("\n[MODE]")
    print("  network: ", network)
    print("  direction: ", direction)

    print("\n[FILES]")
    print("  input_file: ", configfile.input_file)
    print("  output_file: ", configfile.output_file)
    print("  mapping: ", configfile.mapping.name)
    max = 30
    if user_message and len(user_message) < 50: max = len(user_message)
    if direction == "inject": print("  message: ", user_message[:max])

    print("\n[FILTER]")
    print("  src_ip: ", configfile.src_ip)
    print("  dst_ip: ", configfile.dst_ip)
    print("  src_port: ", configfile.src_port)
    print("  dst_port: ", configfile.dst_port)
    print("  proto: ", configfile.proto)
    if network == "online":
        print("  iptables_chain: ", configfile.iptables_chain)
        print("  iptables_queue: ", configfile.iptables_queue)
        print("\n")


    #prepare technique, mapping, message, covertchannel
    technique = TECHNIQUE_FOLDER + "/" + configfile.mapping.technique
    exec(compile(open(technique, "rb").read(), technique, 'exec'), globals())
    mapping = Mapping(configfile.mapping)
    message = None
    if user_message: message = Message(user_message, configfile.mapping.bits, mapping.getparams())    
    covertchannel = CovertChannel(0 if network == NETWORK_OFFLINE else 1, configfile, message.message if direction == DIRECTION_SEND else None)

    outtype = None
    output_file = configfile.output_file
    if direction == DIRECTION_RECEIVE: 
        outtype = configfile.output_file.split(".")[-1]
        output_file = output_file.replace("." + outtype, ".txt")
        
    return Config(
        network=network,
        direction=direction,
        input_file=configfile.input_file,
        output_file=output_file,
        outfile_type=outtype,
        src_ip=configfile.src_ip,
        dst_ip=configfile.dst_ip,
        src_port=configfile.src_port,
        dst_port=configfile.dst_port,
        proto=configfile.proto,
        mapping=mapping,
        layer=configfile.mapping.layer,
        message=message,
        technique=covertchannel,
        iptables_chain=configfile.iptables_chain,
        iptables_queue=configfile.iptables_queue
    )
