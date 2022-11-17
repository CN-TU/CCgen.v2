import random
from time import sleep
"in",
class CovertChannel():
    def __init__(self, online, config, message):
        self._online = online
        self._firstpkt = 1
        self._lasttime = None
        self._lastvalue = None

    def modify(self, pkt, mappedvalue, params):
        if self._firstpkt == 1:
            self._firstpkt = 0
            self._lasttime = pkt.time
            self._lastvalue = int(mappedvalue)
        else:
            value = self._lastvalue
            self._lastvalue = int(mappedvalue)
            aux = random.randint(1, int(params['prdx']))
            residual = random.random()/pow(10,int(params['pmask']))
            elapsed = aux*2*float(params['pw2'])
            if int(value) == 0:
                elapsed += float(params['pw2'])

            if self._online == 0:
                pkt.time = self._lasttime + elapsed + residual
                self._lasttime = pkt.time
            else:
                sleep(float(elapsed + residual))

        return pkt

    def extract (self, pkt, params):
        if self._lasttime is None:
            self._lasttime = pkt.time
            return
        res = int((pkt.time - self._lasttime) / float(params['pw2']))
        remainder = res % 2
        self._lasttime = pkt.time
        if remainder == 0:
            return 1
        else:
            return 0


