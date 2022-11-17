from sqlalchemy import create_engine
from sqlalchemy import Column, String, Integer, DateTime, Table, Boolean, ForeignKey, UniqueConstraint, func, desc
from sqlalchemy.sql.expression import delete
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, scoped_session, sessionmaker
from sqlalchemy_serializer import SerializerMixin
import datetime, json

from util.helper import DB_PATH

db_locked_by_Flask = False
db_locked_by_Scheduler = False
updateDashboard = False

Base = declarative_base()

ItemConfigs = Table('Config_items', Base.metadata,
    Column('id', Integer, primary_key=True),
    Column('task_id', Integer, ForeignKey('Tasks.id')),  
    Column('config_id', Integer, ForeignKey('Configs.id')))

ItemMappings = Table('Mapping_items', Base.metadata,
    Column('id', Integer, primary_key=True),
    Column('config_id', Integer, ForeignKey('Configs.id')),  
    Column('mapping_id', Integer, ForeignKey('Mappings.id')))

ItemValueMappings = Table('ValueMapping_items', Base.metadata,
    Column('id', Integer, primary_key=True),
    Column('mapping_id', Integer, ForeignKey('Mappings.id')),  
    Column('valuemapping_id', Integer, ForeignKey('Valuemappings.id')))

ItemParameters = Table('Parameter_items', Base.metadata,
    Column('id', Integer, primary_key=True),
    Column('mapping_id', Integer, ForeignKey('Mappings.id')),  
    Column('parameter_id', Integer, ForeignKey('Parameters.id')))

ItemMessages = Table('Message_items', Base.metadata,
    Column('id', Integer, primary_key=True),
    Column('setting_id', Integer, ForeignKey('Settings.id')),  
    Column('message_id', Integer, ForeignKey('Messages.id')))

class Task(Base, SerializerMixin):
    __tablename__ = 'Tasks'

    serialize_only = ('id', 'date_created', 'date_started', 'date_finished', 'network', 'direction', 'input_file', 'output_file', 'config_name', 
        'src_ip', 'src_port', 'dst_ip', 'dst_port', 'proto', 'iptables_chain', 'iptables_queue', 'mapping', 'technique', 'message', 'config', 
        'status', "comment")
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    date_created = Column(DateTime(timezone=True), default=datetime.datetime.now(), nullable=False)
    date_started = Column(DateTime, nullable=True, default=None)
    date_finished = Column(DateTime, nullable=True, default=None)
    network = Column(String(150), nullable=False)
    direction = Column(String(150), nullable=False)
    input_file = Column(String(500), nullable=True, default=None)
    output_file = Column(String(500), nullable=True, default=None)
    config_name = Column(String(500), nullable=False)
    src_ip = Column(String(39), nullable=True, default=None)
    dst_ip = Column(String(39), nullable=True, default=None)
    src_port = Column(Integer, nullable=True, default=None)
    dst_port = Column(Integer, nullable=True, default=None)
    proto = Column(Integer, nullable=True, default=None)
    iptables_chain = Column(String(500), nullable=True, default=None)
    iptables_queue = Column(Integer, nullable=True, default=None)
    mapping = Column(String(150), nullable=False)
    technique = Column(String(150), nullable=False)
    message = Column(String(4000), nullable=True, default=None) 
    status = Column(String(50), nullable=False)
    comment = Column(String(2000), nullable=True, default=None)

    config = relationship('Config', secondary=ItemConfigs, uselist=False, backref='Task')

    def __str__(self):
        return str(self.id) + " " + self.status + " " + self.config_name + " " + self.network + " " + self.direction

class Config(Base, SerializerMixin):
    __tablename__ = 'Configs'

    serialize_only = ('id', 'name', 'input_file', 'output_file', 'src_ip', 'dst_ip', 'src_port', 'dst_port', 'proto', 'iptables_chain', 'iptables_queue', 'mapping', 'wrapper_config')

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    input_file = Column(String(500), nullable=True)
    output_file = Column(String(500), nullable=True)
    src_ip = Column(String(39), nullable=True)
    dst_ip = Column(String(39), nullable=True)
    src_port = Column(Integer, nullable=True)
    dst_port = Column(Integer, nullable=True)
    proto = Column(Integer, nullable=True)
    iptables_chain = Column(String(500), nullable=True)
    iptables_queue = Column(Integer, nullable=True)
    wrapper_config = Column(Boolean, default=False)

    mapping = relationship('Mapping', secondary=ItemMappings, uselist=False, backref='Config')
    
    __table_args__ = (UniqueConstraint('name', name='_config_uc'),)

    def __str__(self):
        return str(self.id) + " " + self.name + " " + " " + self.input_file + " " + self.output_file + " " + mapping.technique

class Mapping(Base, SerializerMixin):
    __tablename__ = 'Mappings'

    serialize_only = ('id', 'name', 'layer', 'technique', 'bits', 'parameters', 'valuemappings')

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    layer = Column(String(10), nullable=False)
    technique = Column(String(150), nullable=False)
    bits = Column(Integer, nullable=False)

    valuemappings = relationship('ValueMapping', secondary=ItemValueMappings, backref='Mapping')
    parameters = relationship('Parameter', secondary=ItemParameters, backref='Mapping')

    __table_args__ = (UniqueConstraint('name', name='_mapping_uc'),)

    def __str__(self):
        return str(self.id) + " " + self.name + " " + self.layer + " " + self.technique + " " + str(self.bits)
    
class ValueMapping(Base, SerializerMixin):
    __tablename__ = 'Valuemappings'

    serialize_only = ('id', 'data_from', 'symbol_to')

    id = Column(Integer, primary_key=True, autoincrement=True)
    data_from = Column(String(200), nullable=False)
    symbol_to = Column(String(200), nullable=False)

    def __str__(self):
        return str(self.id) + " " + self.data_from + " " + self.symbol_to

class Parameter(Base, SerializerMixin):
    __tablename__ = 'Parameters'

    serialize_only = ('id', 'name', 'value')

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    value = Column(String(50), nullable=False)

    def __str__(self):
        return str(self.id) + " " + self.name + " " + self.value

class Setting(Base, SerializerMixin):
    __tablename__ = 'Settings'

    serialize_only = ('id', 'name', 'active', 'network', 'direction', 'input_file', 'output_file', 'src_ip', 'dst_ip', 'src_port', 'dst_port', 'proto', 'iptables_chain', 'iptables_queue', 'message')

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    network = Column(String(150), nullable=False)
    direction = Column(String(150), nullable=False)
    active = Column(Boolean, default=False)
    input_file = Column(String(500), nullable=True)
    output_file = Column(String(500), nullable=True)
    src_ip = Column(String(39), nullable=True)
    dst_ip = Column(String(39), nullable=True)
    src_port = Column(Integer, nullable=True)
    dst_port = Column(Integer, nullable=True)
    proto = Column(Integer, nullable=True)
    iptables_chain = Column(String(500), nullable=True)
    iptables_queue = Column(Integer, nullable=True)
    
    message = relationship('Message', secondary=ItemMessages, uselist=False, backref='Setting')

    def __str__(self):
        return str(self.id) + " " + self.name + " " + self.direction + " " + self.network + " " + str(self.active)

class Message(Base, SerializerMixin): 
    __tablename__ = 'Messages'

    serialize_only = ('id', 'message', 'message_link', 'active')

    id = Column(Integer, primary_key=True, autoincrement=True)
    message = Column(String(4000), nullable=True)
    message_link = Column(String(500), nullable=True)
    active = Column(String(20), nullable=True)

    def __str__(self):
        return str(self.id) + " " + self.message + " " + " " + self.message_link + " " + self.active   
    
engine = create_engine("sqlite:///" + DB_PATH + "?check_same_thread=False", echo=False)
Base.metadata.bind = engine
Base.metadata.create_all()
Session = scoped_session(sessionmaker(bind=engine, autoflush=False, autocommit=False))
session = Session()

def createJsonList(items):
    if len(items) == 0:
        return "[]"
        
    json_list = "["

    for item in items:
        json_list += json.dumps(item.to_dict())
        json_list += ", "

    json_list = json_list[:-2]
    json_list += "]"

    return json_list

def getJsonString(obj):
    return json.dumps(obj)

def getObjectFromJson(json_string):
    return json.loads(json_string) 

def lock_db(thread):
    global db_locked_by_Flask, db_locked_by_Scheduler
    if thread == "flask": 
        while db_locked_by_Scheduler: pass
        db_locked_by_Flask = True
    elif thread == "scheduler": 
        while db_locked_by_Flask: pass
        db_locked_by_Scheduler = True

def unlock_db(thread):
    global db_locked_by_Flask, db_locked_by_Scheduler
    if thread == "flask": db_locked_by_Flask = False
    elif thread == "scheduler": db_locked_by_Scheduler = False
    
def shouldUpdateDashboard():
    global updateDashboard
    if updateDashboard:
        updateDashboard = False
        return getJsonString(True)
    else: return getJsonString(False)

def accessOrModifyDB(thread, mode, obj, obj_class=None, filters=None, value=None, json=False):
    global updateDashboard
    lock_db(thread)
    success = True
    try:
        if mode == "get": 
            if filters == "all": 
                obj = session.query(globals()[obj_class]).all()
                if json: obj = createJsonList(obj)
            elif filters == "id": 
                if value: obj = session.query(globals()[obj_class]).filter_by(id=int(value)).first()
                else: obj = None
            elif filters == "name": obj = session.query(globals()[obj_class]).filter_by(name=value).first()
            elif filters == "setting": obj = session.query(globals()[obj_class]).filter_by(active=value[0], network=value[1], direction=value[2]).first()
        elif mode == "add": 
            session.add(obj)
        elif mode == "delete": 
            obj = session.query(globals()[obj_class]).filter_by(id=value).first()
            if obj: session.delete(obj)
        
        if mode != "get": session.commit()
    except Exception as e:
        session.rollback()
        print(e)
        if mode == "get" and filters == "all": obj = createJsonList([])
        else: obj = None
        success = False
    finally:
        unlock_db(thread)
        if obj_class == "Task" and mode != "get": updateDashboard = True
        if mode == "delete": return success
        else: return obj

    