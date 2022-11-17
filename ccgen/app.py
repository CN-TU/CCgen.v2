# -*- coding: utf-8 -*-
from flask import Flask, render_template, request, jsonify, redirect
from flask_cors import CORS, cross_origin
import logging

from util.database import *
import util.vagrant
import util.config_spammer
import util.helper
import scheduler
import wrapper.wrapper as wrapper

app = Flask(__name__, static_url_path='/static')
CORS(app, support_credentials=True)

#disable logger
logging.getLogger("scapy.runtime").setLevel(logging.ERROR)
logging.getLogger("werkzeug").setLevel(logging.ERROR)

#after abortion or failure init tasks again
tasks = accessOrModifyDB("flask", "get", None, "Task", "all")
for task in tasks:
  if task.config:
    if task.config.wrapper_config: accessOrModifyDB("flask", "delete", None, "Task", "id", task.id)
    else:
      if task.status == "running":
        task.status = "aborted"
        accessOrModifyDB("flask", "add", task)
      elif task.status == "queued": scheduler.addToQueue(task)
  elif not task.status == "succeeded" and not task.status == "failed": accessOrModifyDB("flask", "delete", None, "Task", "id", task.id)
del tasks

#delete unused wrapper configs
configs = accessOrModifyDB("flask", "get", None, "Config", "all")
for config in configs:
  if config.wrapper_config and len(config.Task) == 0:
    accessOrModifyDB("flask", "delete", None, "Config", "id", config.id)
del configs

#spammer/listener config
util.config_spammer.Config(util.helper.SPAMMER_CONFIG_PATH)

@app.route("/")
@app.route("/dashboard")
@cross_origin()
def dashboard():
  return render_template("dashboard.html")

@app.route("/configurator")
@cross_origin()
def configurator():
  return render_template("configurator.html")

@app.route("/settings")
@cross_origin()
def settings():
  return render_template("settings.html")

@app.route("/isConfigNameUnique")
@cross_origin()
def isConfigNameUnique():
  config_name = request.args.get('name')
  config_class = request.args.get('class')
  if not accessOrModifyDB("flask", "get", None, config_class, "name", config_name): return getJsonString(True)
  else: return getJsonString(False)

@app.route("/isInputFileValid")
@cross_origin()
def isInputFileValid():
  path = request.args.get('path')
  return getJsonString(util.helper.isFile(path))

@app.route("/isOutputFileValid")
@cross_origin()
def isOutputValid():
  path = request.args.get('path')   
  return getJsonString(util.helper.isParentDirectory(path))

@app.route("/isTechniqueValid")
@cross_origin()
def isTechniqueValid():
  path = util.helper.TECHNIQUE_FOLDER + "/" + str(request.args.get('path'))  
  return getJsonString(util.helper.isFile(path))

@app.route("/isParameterNameInTechnique")
@cross_origin()
def isParameterNameInTechnique():
  technique = request.args.get('technique')
  if not technique: return getJsonString(False)
  param_name = request.args.get('parameter_name')
  if param_name == "pIAT": return getJsonString(True)
  technique_path = util.helper.TECHNIQUE_FOLDER + "/" + str(request.args.get('technique')) 
  with open(technique_path) as f:
    if "params['" + param_name + "']" in f.read():
      return getJsonString(True)
  return getJsonString(False)

@app.route("/isSuperUser")
@cross_origin()
def isSuperUser():
  return getJsonString(util.helper.IsSuperUser)

@app.route("/hasGoFlowsInstalled")
@cross_origin()
def hasGoFlowsInstalled():
  return getJsonString(wrapper.goflowsExists())

@app.route("/shallUpdateDashboardTables")
@cross_origin()
def shallUpdateDashboardTables():
  return shouldUpdateDashboard()
  
def parseMapping(config):
  valuemappings = []
  for valuemapping in config['mapping']['valuemappings']:
    vm = accessOrModifyDB("flask", "get", None, "ValueMapping", "id", valuemapping['id'])
    if not vm:
      vm = ValueMapping(data_from=valuemapping['data_from'], symbol_to=valuemapping['symbol_to'])
    else:
      vm.data_from = valuemapping['data_from']
      vm.symbol_to = valuemapping['symbol_to']
    valuemappings.append(vm)

  parameters = []
  for parameter in config['mapping']['parameters']:
    param = accessOrModifyDB("flask", "get", None, "Parameter", "id", parameter['id'])
    if not param:
      param = Parameter(name=parameter['name'], value=parameter['value'])
    else:
      param.name = parameter['name']
      param.value = parameter['value']
    parameters.append(param)
  
  mapping = accessOrModifyDB("flask", "get", None, "Mapping", "id", config['mapping']['id'])
  if not mapping:
    mapping = Mapping(name=config['mapping']['name'], technique=config['mapping']['technique'], layer=config['mapping']['layer'], bits=config['mapping']['bits'],
    valuemappings=valuemappings, parameters=parameters)
  else:
    mapping.name=config['mapping']['name']
    mapping.technique=config['mapping']['technique']
    mapping.layer=config['mapping']['layer']
    mapping.bits=config['mapping']['bits']
    mapping.valuemappings=valuemappings
    mapping.parameters=parameters

  return mapping

def parseMessage(setting, isTask=False, isWrapper=False):
  if isWrapper: setting['direction'] = "inject"
  if setting['direction'] == "extract": return None
  if isTask:
    if setting['message']['active'] == "text": return setting['message']['message']
    else: return util.helper.getMessageFromFile(setting['message']['message_link'])

  message = accessOrModifyDB("flask", "get", None, "Message", "id", setting['message']['id'])
  if not message:
    message = Message(message=setting['message']['message'], message_link=setting['message']['message_link'], active=setting['message']['active'])
  else:
    message.message = setting['message']['message']
    message.message_link = setting['message']['message_link']
    message.active=setting['message']['active']
  
  return message

@app.route("/processWrapper", methods=['POST'])
@cross_origin()
def processWrapper():
  wrappedConfig = request.json 
  
  inj_tasks = []
  ext_tasks = []
  auxpcapA = wrappedConfig['output_file'][:-5] + "_auxA.pcap"
  auxpcapB = wrappedConfig['output_file'][:-5] + "_auxB.pcap"  

  wrapper.extract_stats(wrappedConfig['input_file']) 

  no_cc = 0
  for c_idx in range(len(wrappedConfig['configs'])):
    mapping = parseMapping(wrappedConfig['configs'][c_idx]) 
    message = parseMessage(wrappedConfig['configs'][c_idx], True, True)   
    req_pkts = len(util.helper.text2bin(message))

    for i in range(int(wrappedConfig['configs'][c_idx]['repetition'])):
      filters = wrapper.getFilters(wrappedConfig['configs'][c_idx], req_pkts)
      if not filters: continue
      
      no_cc += 1
      if no_cc == 1:
        input_file = wrappedConfig['input_file']
        output_file = auxpcapA
      elif no_cc % 2 == 0:
        input_file = auxpcapA
        output_file = auxpcapB
      else:
        input_file = auxpcapB
        output_file = auxpcapA
      if (c_idx+1) == len(wrappedConfig['configs']) and (i+1) == int(wrappedConfig['configs'][c_idx]['repetition']):
        output_file = wrappedConfig['output_file']

      #create injection task
      config_name = "%03d" %c_idx + "_inject_" + wrappedConfig['configs'][c_idx]['name'] + '_' + "%03d" %i
      config = Config(name=config_name, wrapper_config=True, input_file=input_file, output_file=output_file, src_ip=filters['src_ip'],
        src_port=filters['src_port'], dst_ip=filters['dst_ip'], dst_port=filters['dst_port'], proto=filters['proto'], mapping=mapping)

      task_inj = Task(status="queued", date_created=datetime.datetime.now(), direction="inject", network="offline", message=message,
        input_file=config.input_file, output_file=config.output_file, config_name=wrappedConfig['configs'][c_idx]['name'], src_ip=config.src_ip, src_port=config.src_port,
        dst_ip=config.dst_ip, dst_port=config.dst_port, proto=config.proto, mapping=config.mapping.name, technique=config.mapping.technique, config=config)
      inj_tasks.append(task_inj)

      #create extraction tasks
      output_txt = util.helper.OUT_FOLDER + "/" + "%03d" %c_idx + "_" + config.mapping.technique[:-3] + '_' + "%03d" %i + ".txt"
      config_name = "%03d" %c_idx + "_extract_" + wrappedConfig['configs'][c_idx]['name'] + '_' + "%03d" %i
      config = Config(name=config_name, wrapper_config=True, input_file=wrappedConfig['output_file'], output_file=output_txt, src_ip=filters['src_ip'],
        src_port=filters['src_port'], dst_ip=filters['dst_ip'], dst_port=filters['dst_port'], proto=filters['proto'], mapping=mapping)
      
      task_ext = Task(status="queued", date_created=datetime.datetime.now(), direction="extract", network="offline", message=None, input_file=config.input_file,
        output_file=config.output_file, config_name=wrappedConfig['configs'][c_idx]['name'], src_ip=config.src_ip, src_port=config.src_port,
        dst_ip=config.dst_ip, dst_port=config.dst_port, proto=config.proto, mapping=config.mapping.name, technique=config.mapping.technique, config=config)
      ext_tasks.append(task_ext)

  #queue injection tasks
  for task in inj_tasks:
    task.date_created = datetime.datetime.now()
    task = accessOrModifyDB("flask", "add", task)
    if task: scheduler.addToQueue(task)
  
  #queue extraction tasks
  for task in ext_tasks:
    task.date_created = datetime.datetime.now()
    task = accessOrModifyDB("flask", "add", task)
    if task: scheduler.addToQueue(task)
  
  global updateDashboard
  updateDashboard = True    
  return redirect("/dashboard")

@app.route("/addTask", methods=['POST'])
@cross_origin()
def addTask():
  config = request.json

  mapping = parseMapping(config)
  message = parseMessage(config, True)

  c = accessOrModifyDB("flask", "get", None, "Config", "id", config['id'])
  if not c:
    c = Config(name=config['name'], input_file=config['input_file'], output_file=config['output_file'], 
      dst_ip=config['dst_ip'], dst_port=config['dst_port'], src_ip=config['src_ip'], src_port=config['src_port'], proto=config['proto'],
      iptables_chain=config['iptables_chain'], iptables_queue=config['iptables_queue'], mapping=mapping)
  else:
    c.name = config['name']    
    c.input_file=config['input_file']
    c.output_file=config['output_file']    
    c.src_ip=config['src_ip']
    c.src_port=config['src_port']
    c.dst_ip=config['dst_ip']
    c.dst_port=config['dst_port']
    c.proto=config['proto']
    c.iptables_chain=config['iptables_chain']
    c.iptables_queue=config['iptables_queue']
    c.mapping=mapping   

  task = Task(status="queued", date_created=datetime.datetime.now(), direction=config['direction'], network=config['network'], message=message,
    input_file=c.input_file, output_file=c.output_file, config_name=c.name, src_ip=c.src_ip, src_port=c.src_port, dst_ip=c.dst_ip, dst_port=c.dst_port, 
    proto=c.proto, iptables_chain=c.iptables_chain, iptables_queue=c.iptables_queue, mapping=c.mapping.name, technique=c.mapping.technique, config=c)  
  task = accessOrModifyDB("flask", "add", task, "Task")

  if task: scheduler.addToQueue(task)

  return redirect("/dashboard")

@app.route("/getTasks")
@cross_origin()
def getTasks():
  return accessOrModifyDB("flask", "get", None, "Task", "all", None, True)

@app.route("/deleteTask", methods=['POST'])
@cross_origin()
def deleteTask():
  id = request.json['id']
  accessOrModifyDB("flask", "delete", None, "Task", "id", id)
  return getTasks()

@app.route("/abortTask", methods=['POST'])
@cross_origin()
def abortTask():
  id = request.json['id']
  task = accessOrModifyDB("flask", "get", None, "Task", "id", id)
  if (task.status == "running"):
    scheduler.abortCurrentTask()
  elif (task.status == "queued" and task):
    task.status = "canceled"
    task.date_finished = datetime.datetime.now()
    if task.config and task.config.wrapper_config:
      config_id = task.config.id
      task.config = None
      accessOrModifyDB("flask", "delete", None, "Config", "id", config_id)
    accessOrModifyDB("flask", "add", task, "Task")
  return getTasks()

@app.route("/getConfigs")
@cross_origin()
def getConfigs():
  return accessOrModifyDB("flask", "get", None, "Config", "all", None, True)

@app.route("/deleteConfig", methods=['POST'])
@cross_origin()
def deleteConfig():
  id = request.json['id']
  accessOrModifyDB("flask", "delete", None, "Config", "id", id)
  return getConfigs()

@app.route("/getMappings")
@cross_origin()
def getMappings():
  return accessOrModifyDB("flask", "get", None, "Mapping", "all", None, True)

@app.route("/deleteMapping", methods=['POST'])
@cross_origin()
def deleteMapping():
  id = request.json['id']
  accessOrModifyDB("flask", "delete", None, "Mapping", "id", id)
  return getMappings()

@app.route("/addSetting", methods=['POST'])
@cross_origin()
def addSetting():
  setting = request.json

  message = parseMessage(setting)

  s = accessOrModifyDB("flask", "get", None, "Setting", "id", setting['id'])
  if (s):
    s.name = setting['name']
    s.direction=setting['direction']
    s.dst_ip=setting['dst_ip']
    s.dst_port=setting['dst_port']
    s.input_file=setting['input_file']
    s.message=message
    s.network=setting['network']
    s.output_file=setting['output_file']
    s.proto=setting['proto']
    s.src_ip=setting['src_ip']
    s.src_port=setting['src_port']
    s.iptables_queue=setting['iptables_queue']
  else:
    s = Setting(name=setting['name'], direction=setting['direction'], dst_ip=setting['dst_ip'], dst_port=setting['dst_port'],
    input_file=setting['input_file'], message=message, network=setting['network'], output_file=setting['output_file'], 
    proto=setting['proto'], src_ip=setting['src_ip'], src_port=setting['src_port'], iptables_queue=setting['iptables_queue'])

  setting = accessOrModifyDB("flask", "add", s)

  activateSetting(setting.id, setting.network, setting.direction)

  return redirect("/")

@app.route("/getSettings")
@cross_origin()
def getSettings():
  return accessOrModifyDB("flask", "get", None, "Setting", "all", None, True)

@app.route("/getSetting")
@cross_origin()
def getSetting():
  network = request.args.get('network')
  direction = request.args.get('direction')

  setting = accessOrModifyDB("flask", "get", None, "Setting", "setting", [True, network, direction])
  if setting: return getJsonString(setting.to_dict())
  return getJsonString({})

@app.route("/deleteSetting", methods=['POST'])
@cross_origin()
def deleteSetting():
  id = request.json['id']
  accessOrModifyDB("flask", "delete", None, "Setting", "id", id)
  return getSettings()

@app.route("/activateSetting", methods=['POST'])
@cross_origin()
def activateSetting(id=None, network=None, direction=None):
  if not id: 
    id = request.json['id']
    network = request.json['network']
    direction = request.json['direction']

  #reset first
  setting_reset = accessOrModifyDB("flask", "get", None, "Setting", "setting", [True, network, direction])
  if setting_reset:
    setting_reset.active = False
    accessOrModifyDB("flask", "add", setting_reset)

  #set new setting
  setting = accessOrModifyDB("flask", "get", None, "Setting", "id", id)
  if setting:
    setting.active = True
    accessOrModifyDB("flask", "add", setting)
    settings = getSettings()

  return settings

@app.route("/statusSpammerVM")
@cross_origin()
def statusSpammerVM():
  status = util.vagrant.statusVM()

  ip = "-"
  spammer_status = False
  listener_status = util.vagrant.getListenerScriptStatus()
  if status: 
    ip = util.vagrant.ipVM()
    spammer_status = util.vagrant.getSpammerScriptStatus()
  return getJsonString({"ip" : ip, "status" : status, "spammer" : spammer_status, "listener" : listener_status})

@app.route("/startSpammerVM")
@cross_origin()
def startSpammerVM():
  data = getObjectFromJson(statusSpammerVM().data)
  result = False
  spammer_status = False
  listener_status = util.vagrant.getListenerScriptStatus()
  
  if data['status'] == False: result = util.vagrant.runVM("up")
  elif data['status']: result = util.vagrant.runVM("reload")
  
  if not result: return getJsonString({"ip" : "-", "status" : None, "spammer" : False, "listener" : listener_status})
  spammer_status = util.vagrant.getSpammerScriptStatus()
  ip = util.vagrant.ipVM()
  return getJsonString({"ip" : ip, "status" : True, "spammer" : spammer_status, "listener" : listener_status})

@app.route("/stopSpammerVM")
@cross_origin()
def stopSpammerVM():
  util.vagrant.stopVM()
  spammer_status = util.vagrant.getSpammerScriptStatus()
  listener_status = util.vagrant.getListenerScriptStatus()
  status = util.vagrant.statusVM()
  return getJsonString({"status" : status, "ip" : "-", "spammer" : spammer_status, "listener" : listener_status})

@app.route("/sshSpammerVM")
@cross_origin()
def sshSpammerVM():
  result = util.vagrant.sshVM()
  return getJsonString({"result" : result})

@app.route("/startSpammerScript")
@cross_origin()
def startSpammerScript():
  vm_status = util.vagrant.statusVM()
  listener_status = util.vagrant.getListenerScriptStatus()
  if listener_status: 
    spammer_status = util.vagrant.startSpammerScript()
    if not spammer_status: spammer_status = util.vagrant.getSpammerScriptStatus()
  else: spammer_status = False
  return getJsonString({"spammer" : spammer_status, "listener" : listener_status, "vm" : vm_status})

@app.route("/stopSpammerScript")
@cross_origin()
def stopSpammerScript():
  vm_status = util.vagrant.statusVM()
  listener_status = util.vagrant.getListenerScriptStatus()
  spammer_status = util.vagrant.stopSpammerScript()
  spammer_status = util.vagrant.getSpammerScriptStatus()
  return getJsonString({"spammer" : spammer_status, "listener" : listener_status, "vm" : vm_status})

@app.route("/startListenerScript")
@cross_origin()
def startListenerScript():
  vm_status = util.vagrant.statusVM()
  spammer_status = util.vagrant.getSpammerScriptStatus()
  listener_status = util.vagrant.getListenerScriptStatus()
  if not listener_status: 
    util.vagrant.startListenerScript()
    listener_status = util.vagrant.getListenerScriptStatus()
    spammer_status = util.vagrant.getSpammerScriptStatus()
  return getJsonString({"spammer" : spammer_status, "listener" : listener_status, "vm" : vm_status})

@app.route("/stopListenerScript")
@cross_origin()
def stopListenerScript():
  vm_status = util.vagrant.statusVM()
  util.vagrant.stopListenerScript()
  listener_status = util.vagrant.getListenerScriptStatus()
  spammer_status = util.vagrant.getSpammerScriptStatus()
  return getJsonString({"spammer" : spammer_status, "listener" : listener_status, "vm" : vm_status})

@app.route("/getSpammerConfig")
@cross_origin()
def getSpammerConfig():
  spammer_config = util.config_spammer.getConfig()
  return spammer_config.toJSON().replace("\n", "")

@app.route("/updateSpammerConfig", methods=['POST'])
@cross_origin()
def updateSpammerConfig():
  config = request.json
  util.vagrant.stopSpammerScript()
  util.vagrant.stopListenerScript()
  util.config_spammer.updateConfig(config['target'], config['instructions'])
  vm_status = util.vagrant.statusVM()
  if vm_status: util.vagrant.rsyncVM()
  util.vagrant.startListenerScript()
  util.vagrant.startSpammerScript()
  listener_status = util.vagrant.getListenerScriptStatus()
  spammer_status = util.vagrant.getSpammerScriptStatus()
  return getJsonString({"listener" : listener_status, "spammer" : spammer_status})


if __name__ == "__main__":
  app.run(host='0.0.0.0', port=5000)
