import random

class CovertChannel():
    def __init__(self, online, config, message):
        if online: raise Exception('Online mode not implemented!')
        self._lasttime = None
        self._mappedvalue = None

    def modify(self, pkt, mappedvalue, params):
        if not self._lasttime: pass
        elif self._mappedvalue == "1":
            while (pkt.time - self._lasttime) < float(params['pthr']):
                pkt.time += float(params['pthr'])
        elif self._mappedvalue == "0":
            while (pkt.time - self._lasttime) > float(params['pthr']):
                pkt.time -= float(params['pthr'])
            if (pkt.time - self._lasttime) < 0:
                pkt.time = self._lasttime + random.random()*float(params['pmin'])
        self._lasttime = pkt.time
        self._mappedvalue = mappedvalue
        return pkt

    def extract (self, pkt, params):
        data = None
        if not self._lasttime: pass
        elif (pkt.time - self._lasttime) > float(params['pthr']): data = "1"
        else: data = "0"
        self._lasttime = pkt.time
        return data
