import random

class CovertChannel():
    def __init__(self, online, config, message):
        if online:
            raise Exception('Online mode not implemented!')
        self._firstpkt = 1
        self._lasttime = None
        self._mappedvalue = None

    def modify(self, pkt, mappedvalue, params):
        if self._firstpkt == 1:
            self._firstpkt = 0
            self._lasttime = pkt.time
        else:
            pthr = float(params['pthr'])
            if int(self._mappedvalue) == 1:
                while (pkt.time - self._lasttime) < pthr:
                    pkt.time += pthr
            else:
                while (pkt.time - self._lasttime) > pthr:
                    pkt.time -= pthr
                if (pkt.time - self._lasttime) < 0:
                    pkt.time = self._lasttime + random.random()*float(params['pmin'])
        self._lasttime = pkt.time
        self._mappedvalue = int(mappedvalue)
        return pkt

    def extract (self, pkt, params):
        if self._lasttime is None:
            self._lasttime = pkt.time
            return
        elif (pkt.time - self._lasttime) > float(params['pthr']):
            self._lasttime = pkt.time
            return 1
        else: #round((pkt.time - self._lasttime), 4) <= self._threshhold0:
            self._lasttime = pkt.time
            return 0
        #else:
        #    assert False, 'Could not classify packet (%s)!' % round((pkt.time - self._lasttime), 4)
