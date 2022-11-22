class CovertChannel():
    def __init__(self, online, config, message):
        if online: raise Exception('Online mode not implemented!')
        self._lasttime = None
        self._timebuffer = 0

    def modify(self, pkt, mappedvalue, params):
        if not self._lasttime: 
            self._lasttime = pkt.time
        elif mappedvalue == "0":
            pkt = None
        elif mappedvalue == "1":
            self._lasttime += self._timebuffer
            pkt.time = self._lasttime
            self._timebuffer = 0
        self._timebuffer += float(params['pTI'])
        return pkt

    def extract (self, pkt, params):
        if not self._lasttime:
            self._lasttime = pkt.time
            return None
        zeros = int((pkt.time - self._lasttime) / float(params['pTI']))
        self._lasttime = pkt.time
        return "0" * zeros + "1"
