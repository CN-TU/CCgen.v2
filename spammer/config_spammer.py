import configparser, json

config = None

def updateConfig(target, instructions):
    global config
    config.target = target
    config.instructions = []
    config.listenerConfig = ListenerConfig()
    for instruction in instructions:
        if instruction['mode'] == "TCP" or instruction['mode'] == "UDP":
            config.listenerConfig.addInstruction(ListenerInstruction(instruction['mode'], instruction['dst_port']))
        config.instructions.append(Instruction(instruction['mode'], instruction['src_ip'], instruction['src_port'], instruction['dst_port'], instruction['pattern'], instruction['packets'], instruction['repeat'], instruction['duration']))
    config.writeSpammerConfig()
    
def getConfig():
    return config

class Instruction:
    def __init__(self, mode, src_ip, src_port, dst_port, pattern, packets, repeat, duration):
        self.mode = mode
        self.src_ip = src_ip
        self.src_port = src_port
        self.dst_port = dst_port
        self.pattern = pattern
        self.packets = packets
        self.repeat = repeat
        self.duration = duration

class ListenerInstruction:
    def __init__(self, method, dst_port):
        self.method = method
        self.dst_port = dst_port
    

class ListenerConfig:
    def __init__(self):
        self.instructions = []

    def addInstruction(self, instruction):
        self.instructions.append(instruction)


class Config:
    def isFloat(self, x):
        try:
            float(x)
            return True
        except:
            return False

    def __init__(self, path):
        self.path = path
        self.target = ""
        self.listenerConfig = ListenerConfig()
        self.instructions = []

        c = configparser.ConfigParser()
        c.read(self.path)
        try:
            section = c.sections()[-1]
            self.target = c.get(section, 'target')
            for instruction in c.get(section, 'send').split():
                if ',' in instruction:
                    comm, pattern, repeat, packets = instruction.split(',')
                    method, src_ip, src_port, dst_port = comm.split(':')
                    instruction = Instruction(method, src_ip, src_port, dst_port, pattern, packets, repeat, None)
                    self.instructions.append(instruction)
                    self.listenerConfig.addInstruction(ListenerInstruction(method, dst_port))
                elif instruction == 'restart':
                    self.instructions.append(Instruction("restart", None, None, None, None, None, None, None))
                elif self.isFloat(instruction):
                    self.instructions.append(Instruction("wait", None, None, None, None, None, None, instruction))
                elif '-' in instruction:
                    self.instructions.append(Instruction("wait", None, None, None, None, None, None, instruction))
        except:
            print('Could not load configuration.')

        global config
        config = self
    
    def writeSpammerConfig(self):
        c = configparser.ConfigParser()
        c.read(self.path)
        error = False
        try:
            section = c.sections()[-1]
            c.set(section, 'target', self.target)
            send_string = "\n"
            for instruction in self.instructions:
                if instruction.mode == "restart":
                    send_string += "restart\n"
                elif instruction.mode == "wait":
                    send_string += str(instruction.duration) + "\n"
                else:
                    send_string += instruction.mode + ":" + instruction.src_ip + ":" + str(instruction.src_port) + ":" + str(instruction.dst_port) + "," + instruction.pattern + "," + str(instruction.packets) + "," + str(instruction.repeat) + "\n"
                c.set(section, 'send', send_string)

            with open(self.path, 'w') as configfile: 
                c.write(configfile)
        except:
            error = True
            print('Error while writing to spammer configuration.')

    def toJSON(self):
        return json.dumps(self, default=lambda o: o.__dict__, 
            sort_keys=True, indent=4)


