import random
from time import sleep

class CovertChannel():
    def __init__(self, online, config, message):
        self._online = online
        self._lasttime = None
        self._lastvalue = None

    def modify(self, pkt, mappedvalue, params):
        if not self._lasttime: self._lasttime = pkt.time
        else:
            aux = random.randint(1, int(params['prdx']))
            residual = random.random()/pow(10,int(params['pmask']))
            elapsed = aux*2*float(params['pw2'])
            if self._lastvalue == "0":
                elapsed += float(params['pw2'])
            if not self._online:
                self._lasttime += elapsed + residual
                pkt.time = self._lasttime
            else:
                sleep(float(elapsed + residual))
        self._lastvalue = mappedvalue
        return pkt

    def extract (self, pkt, params):
        remainder = None
        if self._lasttime: remainder = int((pkt.time - self._lasttime) / float(params['pw2'])) % 2
        self._lasttime = pkt.time
        if remainder == 0: return "1"
        elif remainder == 1: return "0"
        else: return None


