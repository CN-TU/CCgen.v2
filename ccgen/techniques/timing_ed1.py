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
            self._timebuffer += float(params['pTw'])
        elif mappedvalue == "1":
            if self._timebuffer > 0:
                self._lasttime += self._timebuffer
                pkt.time = self._lasttime
                self._timebuffer = 0
            elif (self._lasttime - pkt.time) > (float(params['pTw']) * 0.9):
                self._lasttime += (float(params['pTw']) * 0.2) #change pkt.time to 20% of the t_wait parameter
                pkt.time = self._lasttime        
        return pkt

    def extract (self, pkt, params):
        if not self._lasttime:
            self._lasttime = pkt.time
            return None
        zeros = int((pkt.time - self._lasttime) / float(params['pTw']))
        self._lasttime = pkt.time
        return "0" * zeros + "1"
