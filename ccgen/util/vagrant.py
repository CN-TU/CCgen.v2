from subprocess import Popen, PIPE
from pathlib import Path

vagrant_path = str(Path(__file__).parent.parent.parent.absolute()) + "/spammer"
listener_path = str(Path(__file__).parent.parent.parent.absolute()) + "/listener/listener.py"
file_path = str(Path(__file__).parent.absolute())

def vagrantInterface(args, hasReturnValue, wait=True):
    try:
        p = Popen(args, shell=True, stdout=PIPE)
        if wait: p.wait()
        if hasReturnValue: return p.stdout.read().decode()
        else: return True
    except:
        if hasReturnValue: return None
        else: return False

def runVM(mode):
    cmd = ". " + file_path + "/vm_scripts/runVM.sh"
    return vagrantInterface([cmd, vagrant_path, mode], False)

def stopVM():
    cmd = ". " + file_path + "/vm_scripts/stopVM.sh"
    return vagrantInterface([cmd, vagrant_path], False)

def statusVM():    
    cmd = ". " + file_path + "/vm_scripts/statusVM.sh"
    out = vagrantInterface([cmd, vagrant_path], True)
    if not out: return None
    elems = out.split('\n')[2].split(' ')
    status = elems[len(elems)-2]
    if status == "running": return True
    elif status == "poweroff": return False
    else: return None

def ipVM():
    cmd = ". " + file_path + "/vm_scripts/ipVM.sh"
    out = vagrantInterface([cmd, vagrant_path], True)
    if not out: return "-"
    vm_ip = out.split('\n')[1].split(' ')[9]
    return vm_ip

def sshVM():
    ssh_script = str(Path(__file__).parent.parent.parent.absolute()) + "/spammer/utils/start_spammer_vm.sh"
    cmd = ". " + file_path + "/vm_scripts/sshVM.sh"
    out = vagrantInterface([cmd, ssh_script, vagrant_path], False, False)
    return out

def rsyncVM():
    cmd = ". " + file_path + "/vm_scripts/rsyncVM.sh"
    out = vagrantInterface([cmd, vagrant_path], False, True)
    return out

def startSpammerScript():
    cmd = ". " + file_path + "/vm_scripts/startSpammerScript.sh"
    return vagrantInterface([cmd, vagrant_path], False)

def restartSpammerScript():
    cmd = ". " + file_path + "/vm_scripts/startSpammerScript.sh"
    return vagrantInterface([cmd, vagrant_path], False)

def stopSpammerScript():
    cmd = ". " + file_path + "/vm_scripts/stopSpammerScript.sh"
    return vagrantInterface([cmd, vagrant_path], False)

def getSpammerScriptStatus():
    cmd = ". " + file_path + "/vm_scripts/getSpammerScriptStatus.sh"
    out = vagrantInterface([cmd, vagrant_path], True)
    if not out : return False
    elif out.strip() == "active": return True
    else: return False

def startListenerScript():
    cmd = ". " + file_path + "/vm_scripts/startListenerScript.sh"
    return vagrantInterface([cmd, listener_path], False, False)

def restartListenerScript():
    return startListenerScript()

def stopListenerScript():
    cmd = ". " + file_path + "/vm_scripts/getListenerScriptStatus.sh"
    out = vagrantInterface([cmd, vagrant_path], True)
    for line in out.split("\n"):
        if not line: continue
        columns = line.split(" ")
        columns = [x for x in columns if x]
        script_name = columns[len(columns)-1].split("/")
        script_name = script_name[len(script_name)-1]
        if (script_name.strip() == "listener.py"):
            pid = columns[1]
            cmd = ". " + file_path + "/vm_scripts/stopListenerScript.sh"
            vagrantInterface([cmd, pid], False)
            if not getListenerScriptStatus(): return True
    return False

def getListenerScriptStatus():
    cmd = ". " + file_path + "/vm_scripts/getListenerScriptStatus.sh"
    out = vagrantInterface([cmd, vagrant_path], True)
    for line in out.split("\n"):
        columns = line.split(" ")
        script_name = columns[len(columns)-1].split("/")
        script_name = script_name[len(script_name)-1]
        if script_name.strip() == "listener.py": return True
    return False