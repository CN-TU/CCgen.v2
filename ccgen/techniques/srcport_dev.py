from scapy.layers.inet import IP, TCP, UDP

class CovertChannel():
    def __init__(self, online, config, message):
        self._lastval = None

    def modify(self, pkt, mappedvalue, params):
        if pkt.haslayer(TCP):
            pktL = pkt[TCP]
        elif pkt.haslayer(UDP):
            pktL = pkt[UDP]

        if self._lastval == None:
            pktL.sport = int(params['pmin'])+int(mappedvalue)
        else:
            pktL.sport = self._lastval+int(mappedvalue)
        self._lastval = pktL.sport
        if self._lastval >= int(params['pthr']):
            self._lastval = None
        return pkt

    def extract(self, pkt, params):
        if pkt.haslayer(TCP):
            pktL = pkt[TCP]
        elif pkt.haslayer(UDP):
            pktL = pkt[UDP]

        if self._lastval == None:
            ret = int(pktL.sport) - int(params['pmin'])
        else:
            ret = int(pktL.sport) - self._lastval
        self._lastval = int(pktL.sport) 
        return ret
