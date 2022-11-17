from scapy.layers.inet import IP

class CovertChannel():
    def __init__(self, online, config, message):
        self._firstpkt = 1
        self._lastval = None
        self._nolastval = None

    def modify(self, pkt, mappedvalue, params):
        if self._firstpkt == 1:
            self._firstpkt = 0
            if int(mappedvalue):
                pkt[IP].ttl = int(params['ph'])
            else:
                pkt[IP].ttl = int(params['pl'])
        else:
            if int(mappedvalue) == 0:
                pkt[IP].ttl = int(self._lastval)
            else:
                pkt[IP].ttl = int(self._nolastval)
        l = [v for v in [int(params['ph']), int(params['pl'])] if v == pkt[IP].ttl]
        nl = [v for v in [int(params['ph']), int(params['pl'])] if v != pkt[IP].ttl]
        self._lastval =  l[0]
        self._nolastval =  nl[0]
        return pkt

    def extract(self, pkt, params):
        if self._lastval == None:
            if pkt[IP].ttl == int(params['ph']):
                self._lastval = int(params['ph'])
                self._nolastval = int(params['pl'])
                return 1
            else:
                self._lastval = int(params['pl'])
                self._nolastval = int(params['ph'])
                return 0
        else:
            if pkt[IP].ttl == self._lastval:
                return 0
            else:
                self._lastval = pkt[IP].ttl
                return 1
