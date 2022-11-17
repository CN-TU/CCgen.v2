var last_id = null;
var config = {};
var setting = {};
var settingFields = new Array(9).fill(false);
var configs = [];
var mappings = [];
var wrapper = {};
var goflows = false;

$(document).ready(function () {
    $.get("/getConfigs", function (data) {
        configs = JSON.parse(data);
        configs.forEach(function (c) {
            $('#configSelector').append($('<option>', {
                value: c.id,
                text: c.name
            }));
        });
    });
    $.get("/getMappings", function (data) {
        mappings = JSON.parse(data);
        mappings.forEach(function (m) {
            $('#mappingSelector').append($('<option>', {
                value: m.id,
                text: m.name
            }));
        });
    });
    $.get("isSuperUser", function (data) {
        var isSuperUser = JSON.parse(data);
        if (isSuperUser) {
            network = window.localStorage.getItem('network');
            if (network) $('#modusNetworkSelector').val(network).trigger('change');
            else $('#modusNetworkSelector').val("offline").trigger('change');
        } else {
            $('#modusNetworkSelector')[0].remove(1);
            $('#modusNetworkSelector').val("offline").trigger('change');
        }
    });
    $.get("hasGoFlowsInstalled", function (data) {
        goflows = JSON.parse(data);
    });
    
    direction = window.localStorage.getItem('direction');    
    if (direction) $('#modusDirectionSelector').val(direction).trigger('change');
    else $('#modusDirectionSelector').val("inject").trigger('change');
    if (direction == "inject") handleMessageSelector("text");
});

/* -------------- VALIDATIONS -------------- */
function setFileName(elem) {
    var data = /^[a-z0-9_.@()-]+$/i.test(elem.value);
    var message = "";
    if (elem.id == "configname") {
        if ($('#saveAsNewConfig').is(':checked') || !config.id) {
            $.get("/isConfigNameUnique", { 'name': elem.value, 'class' : "Config" }, function (response) {
                data = JSON.parse(response);
                if (!data) message = "A config with the same name already exists!";
                inputCallback(data, elem, message);
            });
        }
    }
    if (!data) message = "Invalid characters for config name!";
    inputCallback(data, elem, message);
}

function setInput(elem) {
    if ($('#modusNetworkSelector').val() == "online") return;
    var message = "";
    var extension = elem.value.split('.').pop();
    $.get("/isInputFileValid", { 'path': elem.value }, function (response) {
        var data = JSON.parse(response)
        if (data && extension == "pcap") data = true;
        if (!data) message = "Check input path. Could not find input file!";
        else if (extension != "pcap") message = "Invalid input file. Input file needs to be a '.pcap' file!";

        if (settingFields[0] && !data && elem.value != setting.input_file && setting.input_file) {
            elem.value = setting.input_file;
            settingFields[0] = false;
            setInput(elem);            
        } else settingFields[0] = false;
        inputCallback(data, elem, message);
    });
}

function setOutput(elem) {
    if ($('#modusNetworkSelector').val() == "online" && $('#modusDirectionSelector').val() == "inject") return;
    var message = "";
    var extension = elem.value.split('.').pop();
    var data = false;
    if ($('#modusDirectionSelector').val() == "inject" && extension == "pcap") {
        $.get("/isOutputFileValid", { 'path': elem.value }, function (response) {
            data = JSON.parse(response);
            if (!data) message = "Check output path. Could not find folder of output path!";
            if (settingFields[1] && !data && elem.value != setting.output_file && setting.output_file) {
                elem.value = setting.output_file;
                settingFields[1] = false;
                setOutput(elem);
            } else settingFields[1] = false;
            inputCallback(data, elem, message);
        });
    } else if ($('#modusDirectionSelector').val() == "extract" && extension == "txt") {
        $.get("/isOutputFileValid", { 'path': elem.value }, function (response) {
            data = JSON.parse(response);
            if (!data) message = "Check output path. Could not find folder of output path!";
            if (settingFields[1] && !data && elem.value != setting.output_file && setting.output_file) {
                elem.value = setting.output_file;
                settingFields[1] = false;
                setOutput(elem);                
            } else settingFields[1] = false;
            inputCallback(data, elem, message);
        });
    } else {
        if ($('#modusDirectionSelector').val() == "inject") {
            if (extension != "pcap") message = "Invalid output file. Output file needs to be a '.pcap' file!";
        } else if ($('#modusDirectionSelector').val() == "extract") {
            if (extension != "txt") message = "Invalid output file. Output file needs to be a '.txt' file!";
        }
        if (settingFields[1] && !data && elem.value != setting.output_file && setting.output_file) {
            elem.value = setting.output_file;
            settingFields[1] = false;
            setOutput(elem);
        } else settingFields[1] = false;
        inputCallback(false, elem, message);
    }
}

function setCovertMessage(elem) {
    if ($('#modusDirectionSelector').val() == "extract") return;
    var message = "";
    var data = false;
    if (elem.id == "configmessage" && $('#configMessageSelector').val() == "text") {
        if (elem.value && ascii_regex.test(elem.value)) data = true;
        else message = "Invalid characters detected. Only ASCII characters are allowed"
        if (settingFields[2] && !data && elem.value != setting.message) {
            elem.value = setting.message;
            settingFields[2] = false;
            setCovertMessage(elem);        
        } else settingFields[2] = false;
        inputCallback(data, elem, message);
    } else if (elem.id == "configmessagelink" && $('#configMessageSelector').val() == "link") {
        var extension = elem.value.split('.').pop();
        if (extension != "txt") inputCallback(false, elem, "File must be of type '.txt'!")
        else {
            $.get("/isInputFileValid", { 'path': elem.value }, function (response) {
                data = JSON.parse(response);
                if (!data) message = "File does not exist! Check file path again";
                inputCallback(data, elem, message);
            });
        }
    } else inputCallback(true, elem, "");
}

function setIpAddress(elem) {
    var message = "";
    var data = false;
    if (!elem.value) data = true;
    else {
        if (ipv4_regex.test(elem.value)) data = true;
        else message = "Invalid ip address! Enter IPv4 address.";
    }
    if (elem.id == "configsrcip") {
        if (settingFields[3] && !data && elem.value != setting.src_ip && setting.src_ip) {
            elem.value = setting.src_ip;
            settingFields[3] = false;
            setIpAddress(elem);            
        } else settingFields[3] = false;
    }
    else if (elem.id == "configdstip") {
        if (settingFields[4] && !data && elem.value != setting.dst_ip && setting.dst_ip) {
            elem.value = setting.dst_ip;
            settingFields[4] = false;
            setIpAddress(elem);      
        } else settingFields[4] = false;
    }
    inputCallback(data, elem, message);
}

function setPort(elem) {
    var message = "";
    var data = false;
    if (!elem.value) elem.value = 0;
    var number = parseFloat(elem.value);
    if (Number.isInteger(number) && number >= 0 && number < 65536) data = true;
    if (elem.value == 0) elem.value = null;
    if (!data) message = "Invalid input. Number must be integer, greater than 0 and smaller than 65536! Set field to null by entering 0!";
    if (elem.id == "configsrcport" && settingFields[5] && !data && elem.value != setting.src_port && setting.src_port) {
        elem.value = setting.src_port;
        settingFields[5] = false;
        setPort(elem);
    } else settingFields[5] = false;
    if (elem.id == "configdstport" && settingFields[6] && !data && elem.value != setting.dst_port && setting.dst_port) {
        elem.value = setting.dst_port;
        settingFields[6] = false;
        setPort(elem);                  
    } else settingFields[6] = false;
    inputCallback(data, elem, message);
}

function setNullableInteger(elem, lower, upper) {
    var message = "";
    var data = false;
    if (!elem.value) elem.value = -1;
    var number = parseFloat(elem.value);
    if (Number.isInteger(number) && number >= lower && number < upper) data = true;
    if (elem.value == -1) elem.value = null;
    if (!data) message = "Invalid input. Number must be integer, greater than " + (lower + 1).toString() + " and smaller than " + upper.toString() + "! Set field to null by entering -1!";
    if (elem.id == "configproto" && settingFields[7] && !data && elem.value != setting.proto && setting.proto) {
        elem.value = setting.proto;
        settingFields[7] = false;
        setNonNullableInteger(elem);
    } else settingFields[7] = false;
    inputCallback(data, elem, "");
}

function setMappingTechnique(elem) {
    var message = "";
    var extension = elem.value.split('.').pop();
    $.get("/isTechniqueValid", { 'path': elem.value }, function (response) {
        var data = JSON.parse(response);
        if (!data) message = "Could not find technique file!"
        else if (extension != "py") message = "Technique file needs '.py' extension.";
        inputCallback(data, elem, message);
    });
}

function setNonNullableInteger(elem, lower, upper) {
    if (elem.id == "filteriptablesqueue" && $('#modusNetworkSelector').val() == "offline") return;
    var data = false;
    var message = "";
    var bits = parseFloat(elem.value);
    if (Number.isInteger(bits) && bits > lower && bits < upper) data = true;
    if (!data) message = "Invalid input. Number must be integer, greater than " + lower.toString() + " and smaller than " + upper.toString() + "!";
    if (elem.id == "filteriptablesqueue" && settingFields[8] && !data && elem.value != setting.iptables_queue && setting.iptables_queue) {
        elem.value = setting.iptables_queue;
        settingFields[8] = false;
        setNonNullableInteger(elem);     
    } else settingFields[8] = false;
    inputCallback(data, elem, message);
}

function setValue1(elem) {
    var message = "";
    var data = null;
    if (elem.parentElement.parentElement.children[0].innerHTML.includes("Parameter")) {
        data = variablename_regex.test(elem.value);
        $.get("/isParameterNameInTechnique", { 'parameter_name': elem.value, 'technique': $('#mappingtechnique').val() }, function (response) {
            data = JSON.parse(response);
            if (!data) message = "Could not find parameter in given technique file."
            inputCallback(data, elem, message);
        });
    } else {
        data = bit_regex.test(elem.value);
        if (!data) message = "Invalid characters. Value must be binary."
    }
    inputCallback(data, elem, message);
}

function setValue2(elem) {
    var message = "";
    var data = null;
    if (elem.parentElement.parentElement.children[0].innerHTML.includes("Parameter")) {
        if (elem.value) data = true;
        else message = "Field cannot be empty or null!"
    } else {
        data = isNumber(elem.value) && (parseFloat(elem.value) >= 0);
        if (!data) message = "Invalid input. Could not parse integer or float."
    }
    inputCallback(data, elem, message);
}

function inputCallback(data, elem, message) {
    if (data) {
        elem.classList.add("is-valid");
        elem.classList.remove("is-invalid");
        $(elem).attr('title', "Input valid!");
    } else {
        $(elem).attr('title', message);
        elem.classList.add("is-invalid");
        elem.classList.remove("is-valid");
    }
}

function isNumber(value) {
    var x = parseFloat(value);
    return !isNaN(value);
}

let ipv4_regex = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;
let variablename_regex = /^[a-zA-Z_$][0-9a-zA-Z_$]*$/;
let ascii_regex = /^[\x00-\x7F]*$/;
let bit_regex = /^[0-1]*$/;

/* ------------ END VALIDATIONS ------------ */

/* --------------- SELECTORS --------------- */

function handleConfigSelector() {
    //reset form
    $(':input', '#configform')
        .not('select, :button, :submit, :reset, :hidden')
        .val(null)
        .removeClass('is-valid')
        .removeClass('is-invalid')
        .prop('checked', false)
        .prop('selected', false);

    config = {};
    last_id = null;

    $('#configsrcport').addClass('is-valid');
    $('#configdstip').addClass('is-valid');
    $('#configdstport').addClass('is-valid');
    $('#configproto').addClass('is-valid');
    $("#mappingSelector").val('Create new mapping');
    $('#mappingbits').val('1').trigger('change');
    $('#valuemapping-area').html('');
    $('#parameter-area').html('');

    var selected = $("#configSelector").val();
    var direction = $('#modusDirectionSelector').val();
    if (selected != "Create new config") {
        //handle selected config
        settingFields = new Array(9).fill(true);
        c = configs.filter(con => con.id == selected)[0];
        config = c;
        $('#configname').val(c.name).trigger('change');
        $('#configinput').val(c.input_file).trigger('change');
        $('#configoutput').val(c.output_file).trigger('change');
        if (direction == "inject" && setting.message) {
            $('#configmessage').val(setting.message.message).trigger('change');
            $('#configmessagelink').val(setting.message.message_link).trigger('change');
            $('#configMessageSelector').val(setting.message.active).trigger('change');
        }
        $('#configsrcip').val(c.src_ip).trigger('change');
        $('#configsrcport').val(c.src_port).trigger('change');
        $('#configdstip').val(c.dst_ip).trigger('change');
        $('#configdstport').val(c.dst_port).trigger('change');
        $('#configproto').val(c.proto).trigger('change');
        $('#filteriptablesqueue').val(c.iptables_queue).trigger('change');
        if (config.mapping && config.mapping.id) $('#mappingSelector').val(c.mapping.id).trigger('change');
        else $('#mappingSelector').val('Create new mapping').trigger('change');
    } else if (setting.id) {
        //handle new config
        $('#configinput').val(setting.input_file).trigger('change');
        $('#configoutput').val(setting.output_file).trigger('change');
        $('#configsrcip').val(setting.src_ip).trigger('change');
        $('#configsrcport').val(setting.src_port).trigger('change');
        $('#configdstip').val(setting.dst_ip).trigger('change');
        $('#configdstport').val(setting.dst_port).trigger('change');
        $('#configproto').val(setting.proto).trigger('change');
        $('#filteriptablesqueue').val(setting.iptables_queue).trigger('change');
        if (direction == "inject") {
            $('#configmessage').val(setting.message.message).trigger('change');
            $('#configmessagelink').val(setting.message.message_link).trigger('change');
            $('#configMessageSelector').val(setting.message.active).trigger('change');
        }
    }
}

function handleNetworkSelector() {
    var selected = $('#modusNetworkSelector').val();
    var direction = $('#modusDirectionSelector').val();
    if (selected == "online") {
        $('#filteriptableschain').parent().parent().show();
        $('#filteriptablesqueue').parent().parent().show();
        $('#configinput').parent().parent().hide();
        $('#configoutput').parent().parent().hide();
        if (direction == "inject") $('#filteriptableschain').val("OUTPUT").trigger('change');
        else $('#filteriptableschain').val("INPUT").trigger('change');

        $('#configsrcip')[0].parentElement.children[1].innerHTML = "Network is filtered after that source ip address";
        $('#configsrcport')[0].parentElement.children[1].innerHTML = "Network is filtered after that source port";
        $('#configdstip')[0].parentElement.children[1].innerHTML = "Network is filtered after that destination ip address";
        $('#configdstport')[0].parentElement.children[1].innerHTML = "Network is filtered after that destination port";
        $('#configproto')[0].parentElement.children[1].innerHTML = "Network is filtered after that ip protocol number";
        $('#configmessage')[0].parentElement.children[1].innerHTML = "This message will be injected to network";
    } else {
        $('#filteriptableschain').parent().parent().hide();
        $('#filteriptablesqueue').parent().parent().hide();
        $('#configinput').parent().parent().show();
        $('#configoutput').parent().parent().show();

        $('#configsrcip')[0].parentElement.children[1].innerHTML = "Input file is filtered after that source ip address";
        $('#configsrcport')[0].parentElement.children[1].innerHTML = "Input file is filtered after that source port";
        $('#configdstip')[0].parentElement.children[1].innerHTML = "Input file is filtered after that destination ip address";
        $('#configdstport')[0].parentElement.children[1].innerHTML = "Input file is filtered after that destination port";
        $('#configproto')[0].parentElement.children[1].innerHTML = "Input file is filtered after that ip protocol number";
        $('#configmessage')[0].parentElement.children[1].innerHTML = "This message will be injected to .pcap output file";
    }
    settingFields = new Array(9).fill(true);
    window.localStorage.setItem('network', selected)
    setSetting(true);
}

function handleDirectionSelector() {
    var selected = $('#modusDirectionSelector').val();
    var network = $('#modusNetworkSelector').val();
    if (selected == "inject") {
        $('#configoutput')[0].parentElement.children[1].innerHTML = "Output file path with .pcap extension";
        $('#configmessage').parent().parent().show();
        $('#configmessagelink').parent().parent().show();
        $('#configMessageSelector').parent().parent().show();
        if (network == "online") {
            $('#configoutput').parent().parent().hide();
            $('#filteriptableschain').val("OUTPUT").trigger('change');
        }
    } else {
        $('#configoutput')[0].parentElement.children[1].innerHTML = "Output file path with .txt extension";
        $('#configoutput').parent().parent().show();
        $('#configmessage').parent().parent().hide();
        $('#configmessagelink').parent().parent().hide();
        $('#configMessageSelector').parent().parent().hide();
        $('#configmessage').val(null).trigger('change');
        if (network == "online") $('#filteriptableschain').val("INPUT").trigger('change');
    }
    settingFields = new Array(9).fill(true);
    window.localStorage.setItem('direction', selected)
    setSetting(true);
}

function handleMappingSelector() {
    $(':input', '.mapping-area')
        .not('select, :button, :submit, :reset, :hidden')
        .val(null)
        .removeClass('is-valid')
        .removeClass('is-invalid')
        .prop('checked', false)
        .prop('selected', false);

    $('#mappingbits').val('1').trigger('change');
    $('#valuemapping-area').html('');
    $('#parameter-area').html('');
    config.mapping = {};

    var selected = document.getElementById("mappingSelector").value;
    if (selected != "Create new mapping") {
        mapping = mappings.filter(m => m.id == selected)[0];
        config.mapping = mapping;
        $('#mappingname').val(mapping.name).trigger('change');
        $('#mappingtechnique').val(mapping.technique).trigger('change');
        $('#mappingbits').val(mapping.bits).trigger('change');
        $('#mappinglayerSelector').val(mapping.layer).trigger('change');
        numberOfValueMappings = 1;
        mapping.valuemappings.forEach(function (vm) {
            addMappingDetail('#valuemapping-area', vm.id, vm.data_from, vm.symbol_to, "Value mapping " + numberOfValueMappings.toString(), "is-valid");
            numberOfValueMappings++;
        });
        numberOfParameters = 1;
        mapping.parameters.forEach(function (param) {
            addMappingDetail('#parameter-area', param.id, param.name, param.value, "Parameter " + numberOfParameters.toString(), "is-valid");
            numberOfParameters++;
        });
    }
}

function handleConstraintsSelector(elem) {
    var flowkey = elem.parentElement.parentElement.children[4].children[0].value;
    if (flowkey == "1tup" || flowkey == "2tup") elem.value = "None";
}

function handleMessageSelector(active) {
    if (active == "text") {
        $($('#configmessage')[0].parentElement.parentElement).show();
        $($('#configmessagelink')[0].parentElement.parentElement).hide();
    } else {
        $($('#configmessagelink')[0].parentElement.parentElement).show();
        $($('#configmessage')[0].parentElement.parentElement).hide();
    }
}

/* ------------- END SELECTORS ------------- */

/* ---------------- BUTTONS ---------------- */

function addValueMapping() {
    var numberOfValueMappings = document.getElementById('valuemapping-area').children.length;
    var bits = parseInt($('#mappingbits').val());

    if (numberOfValueMappings < Math.pow(2, bits)) addMappingDetail("#valuemapping-area", null, "", "", "Value mapping " + (numberOfValueMappings + 1).toString(), "");
    else alert("Max. number of value mappings is equal to 2^Bits!")
}

function addParameter() {
    var numberOfParameters = document.getElementById('parameter-area').children.length;
    addMappingDetail("#parameter-area", null, "", "", "Parameter " + (numberOfParameters + 1).toString(), "");
}

function deleteConfig() {
    var config_id = config.id;
    if (confirm('Are you sure you want to delete this config (id=' + config_id + ') from database?')) {
        if (config_id) {
            $.ajax({
                type: "POST",
                url: "/deleteConfig",
                data: '{ "id" : "' + config_id + '"}',
                contentType: 'application/json',
                success: function (data) {
                    $('#configSelector option').each(function () {
                        if (!($(this).val() == 'Create new config')) $(this).remove();
                    });
                    configs = JSON.parse(data);
                    configs.forEach(function (c) {
                        $('#configSelector').append($('<option>', {
                            value: c.id,
                            text: c.name
                        }));
                    });
                    $('#configSelector').val('Create new config').trigger('change');
                }
            });
        }
    }
}

function deleteMapping() {
    var mapping_id = config.mapping.id;
    if (confirm('Are you sure you want to delete this mapping (id=' + mapping_id + ') from database?')) {
        if (mapping_id) {
            $.ajax({
                type: "POST",
                url: "/deleteMapping",
                data: '{ "id" : "' + mapping_id + '"}',
                contentType: 'application/json',
                success: function (data) {
                    $('#mappingSelector option').each(function () {
                        if (!($(this).val() == 'Create new mapping')) $(this).remove();
                    });
                    mappings = JSON.parse(data);
                    mappings.forEach(function (m) {
                        $('#mappingSelector').append($('<option>', {
                            value: m.id,
                            text: m.name
                        }));
                    });
                    $('#mappingSelector').val('Create new mapping').trigger('change');
                }
            });
        }
    }
}

function deleteMappingItem(elem) {
    var area = elem.parentElement.parentElement;
    elem.parentElement.remove();

    var name = "";
    if (area.id == "parameter-area") name = "Parameter ";
    else name = "Value mapping ";
    for (var i = 0; i < area.children.length; i++) {
        area.children[i].children[0].innerHTML = name + (i + 1).toString();
    }
}

function validateConfig() {
    //validate inputs
    var allinputscorrect = true;
    $('.form-control').each(function() {
        if ($(this)[0].localName == "input" && $(this).is(':visible') && !$(this).hasClass('is-valid')) {
            var message = "Please fill out this field.";
            inputCallback(false, $(this)[0], message);
            allinputscorrect = false;
        }
    });

    if (!allinputscorrect) return;

    //collect data
    if (!config.hasOwnProperty('id')) config.id = '';
    config.network = $('#modusNetworkSelector').val();
    config.direction = $('#modusDirectionSelector').val()
    config.name = $('#configname').val();
    config.input_file = $('#configinput').val() ? $('#configinput').val() : null;
    config.output_file = $('#configoutput').val() ? $('#configoutput').val() : null;
    if (direction == "inject") {
        if (!config.hasOwnProperty('message')) config.message = {};
        if (!config.message.hasOwnProperty('id')) config.message.id = '';
        config.message.message = $('#configmessage').val() ? $('#configmessage').val() : null;
        config.message.message_link = $('#configmessagelink').val() ? $('#configmessagelink').val() : null;
        config.message.active = $('#configMessageSelector').val();
    } else config.message = null;

    config.src_ip = $('#configsrcip').val() ? $('#configsrcip').val() : null;
    config.src_port = $('#configsrcport').val() ? parseInt($('#configsrcport').val()) : null;
    config.dst_ip = $('#configdstip').val() ? $('#configdstip').val() : null;
    config.dst_port = $('#configdstport').val() ? parseInt($('#configdstport').val()) : null;
    config.proto = $('#configproto').val() ? parseInt($('#configproto').val()) : null;
    config.iptables_chain = $('#filteriptableschain').val();
    config.iptables_queue = $('#filteriptablesqueue').val() ? parseInt($('#filteriptablesqueue').val()) : null;

    //fill in mapping
    if (!config.hasOwnProperty('mapping')) config.mapping = {};
    if (!config.mapping.hasOwnProperty('id')) config.mapping.id = '';
    config.mapping.name = $('#mappingname').val();
    config.mapping.technique = $('#mappingtechnique').val();
    config.mapping.bits = parseInt($('#mappingbits').val());
    config.mapping.layer = $('#mappinglayerSelector').val();
    config.mapping.valuemappings = [];
    $('#valuemapping-area').find($('.valuemapping')).each(function () {
        var valuemapping_elem = $(this).find('input');
        var valuemapping = {};
        var id = null;
        if (valuemapping_elem[0].value) id = parseInt(valuemapping_elem[0].value)
        valuemapping.id = id;
        valuemapping.data_from = valuemapping_elem[1].value;
        valuemapping.symbol_to = valuemapping_elem[2].value;
        config.mapping.valuemappings.push(valuemapping);
    });
    config.mapping.parameters = [];
    $('#parameter-area').find($('.parameter')).each(function () {
        var param_elem = $(this).find('input');
        var parameter = {};
        var id = null;
        if (param_elem[0].value) id = parseInt(param_elem[0].value)
        parameter.id = id;
        parameter.name = param_elem[1].value;
        parameter.value = param_elem[2].value;
        config.mapping.parameters.push(parameter);
    });

    //open summary inside modal
    $('#configsummary').show();
    if (!goflows || config.network == "online" || config.direction == "extract") $('#wrapperBtn').hide();
    $('.modal-body').append('<div class="d-flex mt-2 mb-1"><b>[Config & Files]</b></div>');
    $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Id:&nbsp;</b></p><p class="text-left"> ' + config['id'] + '</p></div>');
    $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Network:&nbsp;</b></p><p class="text-left"> ' + config['network'] + '</p></div>');
    $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Direction:&nbsp;</b></p><p class="text-left"> ' + config['direction'] + '</p></div>');
    $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Name:&nbsp;</b></p><p class="text-left w-50"> ' + config['name'] + '</p></div>');
    if (config.network == "offline") $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Input file:&nbsp;</b></p><p class="text-left w-50"> ' + config['input_file'] + '</p></div>');
    if (config.network == "offline") $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Output file:&nbsp;</b></p><p class="text-left w-50"> ' + config['output_file'] + '</p></div>');
    if (config.direction == "inject" && config.message.active == "text") $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Message:&nbsp;</b></p><p class="text-left w-50"> ' + config.message.message + '</p></div>');
    if (config.direction == "inject" && config.message.active == "link") $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Message:&nbsp;</b></p><p class="text-left w-50"> ' + config.message.message_link + '</p></div>');
    if (config.direction == "inject") $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Message type:&nbsp;</b></p><p class="text-left w-50"> ' + config.message.active + '</p></div>');
    $('.modal-body').append('<div class="d-flex mt-2 mb-1"><b>[Filters]</b></div>');
    $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Source IP Address:&nbsp;</b></p><p class="text-left"> ' + config['src_ip'] + '</p></div>');
    $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Source Port:&nbsp;</b></p><p class="text-left"> ' + config['src_port'] + '</p></div>');
    $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Destination IP Address:&nbsp;</b></p><p class="text-left"> ' + config['dst_ip'] + '</p></div>');
    $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Destination Port:&nbsp;</b></p><p class="text-left"> ' + config['dst_port'] + '</p></div>');
    $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Protocol:&nbsp;</b></p><p class="text-left"> ' + config['proto'] + '</p></div>');
    if (config.network == "online")$('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>IP tables chain:&nbsp;</b></p><p class="text-left"> ' + config['iptables_chain'] + '</p></div>');
    if (config.network == "online") $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>IP tables queue:&nbsp;</b></p><p class="text-left"> ' + config['iptables_queue'] + '</p></div>');
    $('.modal-body').append('<div class="d-flex mt-2 mb-1"><b>[Channel & Mapping]</b></div>');
    $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Id:&nbsp;</b></p><p class="text-left"> ' + config['mapping']['id'] + '</p></div>');
    $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Mapping:&nbsp;</b></p><p class="text-left"> ' + config['mapping']['name'] + '</p></div>');
    $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Technique:&nbsp;</b></p><p class="text-left"> ' + config['mapping']['technique'] + '</p></div>');
    $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Layer:&nbsp;</b></p><p class="text-left"> ' + config['mapping']['layer'] + '</p></div>');
    $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Bits:&nbsp;</b></p><p class="text-left"> ' + config['mapping']['bits'] + '</p></div>');
    for (var i = 0; i < config['mapping']['valuemappings'].length; i++) {
        if (i == 0) $('.modal-body').append('<div class="d-flex mt-2 mb-1"><b>[Value mappings]</b></div>');
        $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Value mapping ' + (i + 1).toString() +
            ':&nbsp;</b></p><div class="d-flex w-15"><p class="text-left"><b>Id:</b> ' + config['mapping']['valuemappings'][i]['id'] +
            '</p></div><p><b>' + config['mapping']['valuemappings'][i]['data_from'] + '</b> -> ' + config['mapping']['valuemappings'][i]['symbol_to'] + '</p></div>');
    }
    for (var i = 0; i < config['mapping']['parameters'].length; i++) {
        if (i == 0) $('.modal-body').append('<div class="d-flex mt-2 mb-1"><b>[Parameters]</b></div>');
        $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Parameter ' + (i + 1).toString() +
            ':&nbsp;</b></p><div class="d-flex w-15"><p class="text-left"><b>Id:</b> ' + config['mapping']['parameters'][i]['id'] +
            '</p></div><div class="d-flex w-25"><p class="text-left"><b>Name:</b> ' + config['mapping']['parameters'][i]['name'] +
            '</p></div><div class="d-flex w-15"><p class="text-left"><b>Value:</b> ' + config['mapping']['parameters'][i]['value'] +
            '</p></div></div>');
    }
}

function wrapConfig() {
    closeModal();
    if (!wrapper.configs || wrapper.configs.length == 0) {
        wrapper.configs = [];
        $('#wrapper-area').css('display', 'block');
        $('#wrapperinput').val(config.input_file).trigger('change');
        $('#wrapperoutput').val(config.output_file).trigger('change');
    }    
    addConfig();
}

function validateWrapper() {
    $('#wrapperBtn').hide();

    //validate inputs
    var allinputscorrect = true;
    $('#wrapper-area .form-control').each(function () {
        if ($(this)[0].localName == "input" && $(this).is(':visible') && !$(this).hasClass('is-valid')) {
            var message = $(this)[0].validationMessage ? $(this)[0].validationMessage : "Please fill out this field.";
            inputCallback(false, $(this)[0], message);
            allinputscorrect = false;
        }
    });

    if (!allinputscorrect) return;

    //collect data
    wrapper.input_file = $('#wrapperinput').val();
    wrapper.output_file = $('#wrapperoutput').val();
    var wrapper_configs = document.getElementById('wrapper-body').children;
    for (var i = 0; i < wrapper.configs.length; i++) {
        wrapper.configs[i].flowkey = wrapper_configs[i].children[4].children[0].value;
        wrapper.configs[i].constraints = wrapper_configs[i].children[5].children[0].value;
        wrapper.configs[i].repetition = parseInt(wrapper_configs[i].children[6].children[0].value);
    }

    //open summary in modal
    $('#configsummary').show();
    $('.modal-body').append('<div class="d-flex mt-2 mb-1"><b>[Files]</b></div>');
    $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Input file:&nbsp;</b></p><p class="text-left w-50"> ' + wrapper['input_file'] + '</p></div>');
    $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Output file:&nbsp;</b></p><p class="text-left w-50"> ' + wrapper['output_file'] + '</p></div>');
    for (var i = 0; i < wrapper['configs'].length; i++) {
        $('.modal-body').append('<div class="d-flex mt-2 mb-1"><b>[Config ' + (i+1).toString() + ']</b></div>');
        $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Message type:&nbsp;</b></p><p class="text-left w-50"> ' + wrapper.configs[i]['message']['active'] + '</p></div>');
        if (wrapper['configs'][i].message.active == "text") $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Message:&nbsp;</b></p><p class="text-left w-50"> ' + wrapper.configs[i]['message']['message'] + '</p></div>');
        else if (wrapper['configs'][i].message.active == "link") $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Message:&nbsp;</b></p><p class="text-left w-50"> ' + wrapper.configs[i]['message']['message_link'] + '</p></div>');
        $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Flow key:&nbsp;</b></p><p class="text-left w-50"> ' + wrapper.configs[i]['flowkey'] + '</p></div>');
        $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Constraints:&nbsp;</b></p><p class="text-left w-50"> ' + wrapper.configs[i]['constraints'] + '</p></div>');
        $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Repetition:&nbsp;</b></p><p class="text-left w-50"> ' + wrapper.configs[i]['repetition'].toString() + '</p></div>');
        $('.modal-body').append('<div class="d-flex"><b>Mapping:</b></div>');
        $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>&emsp;Id:&nbsp;</b></p><p class="text-left"> ' + wrapper.configs[i]['mapping']['id'] + '</p></div>');
        $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>&emsp;Name:&nbsp;</b></p><p class="text-left"> ' + wrapper.configs[i]['mapping']['name'] + '</p></div>');
        $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>&emsp;Technique:&nbsp;</b></p><p class="text-left"> ' + wrapper.configs[i]['mapping']['technique'] + '</p></div>');
        $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>&emsp;Layer:&nbsp;</b></p><p class="text-left"> ' + wrapper.configs[i]['mapping']['layer'] + '</p></div>');
        $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>&emsp;Bits:&nbsp;</b></p><p class="text-left"> ' + wrapper.configs[i]['mapping']['bits'] + '</p></div>');
        for (var j = 0; j < wrapper.configs[i]['mapping']['valuemappings'].length; j++) {
            if (j == 0) $('.modal-body').append('<div class="d-flex mt-2 mb-1"><b>&emsp;[Value mappings]</b></div>');
            $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>&emsp;Value mapping ' + (j + 1).toString() +
                ':&nbsp;</b></p><div class="d-flex w-15"><p class="text-left"><b>Id:</b> ' + wrapper.configs[i]['mapping']['valuemappings'][j]['id'] +
                '</p></div><p><b>' + wrapper.configs[i]['mapping']['valuemappings'][j]['data_from'] + '</b> -> ' + wrapper.configs[i]['mapping']['valuemappings'][j]['symbol_to'] + '</p></div>');
        }
        for (var j = 0; j < wrapper.configs[i]['mapping']['parameters'].length; j++) {
            if (j == 0) $('.modal-body').append('<div class="d-flex mt-2 mb-1"><b>&emsp;[Parameters]</b></div>');
            $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>&emsp;Parameter ' + (i + 1).toString() +
                ':&nbsp;</b></p><div class="d-flex w-15"><p class="text-left"><b>Id:</b> ' + wrapper.configs[i]['mapping']['parameters'][j]['id'] +
                '</p></div><div class="d-flex w-25"><p class="text-left"><b>Name:</b> ' + wrapper.configs[i]['mapping']['parameters'][j]['name'] +
                '</p></div><div class="d-flex w-15"><p class="text-left"><b>Value:</b> ' + wrapper.configs[i]['mapping']['parameters'][j]['value'] +
                '</p></div></div>');
        }
    }        
}

function sendConfig() {
    var data = JSON.stringify(config);
    var url = "/addTask";
    if (wrapper.configs) {
        data = JSON.stringify(wrapper);
        url = "/processWrapper"
    }

    $.ajax({
        type: "POST",
        url: url,
        data: data,
        contentType: 'application/json'
    }).done(function () {
        window.location.replace("/");
    });
}

function closeModal() {
    $('#configsummary').hide();
    $('.modal-body').html('');
}

function removeWrappedConfig(elem) {
    var idx = parseInt(elem.parentElement.parentElement.parentElement.children[0].innerHTML);
    $('#wrapper-body').children().eq(parseInt(idx)-1).remove();
    wrapper.configs.splice(idx-1, 1);
    if (wrapper.configs.length < 1) $('#wrapper-area').css('display', 'none');
    else {
        var wcs = document.getElementById('wrapper-body').children;
        for(var i = 0; i < wcs.length; i++) {
            wcs[i].children[0].innerHTML = ((i+1).toString());
        }
    }
}

/* -------------- END BUTTONS -------------- */ 

/* -------------- HELPER FUNC -------------- */

function setSetting(reload) {
    $.get("/getSetting", { 'network': $('#modusNetworkSelector').val(), 'direction': $('#modusDirectionSelector').val() }, function (data) {
        setting = JSON.parse(data);
        if (reload) $('#configSelector').val($('#configSelector').val()).trigger("change");
    });
}

function addMappingDetail(section, id, value1, value2, name, isValid) {
    var areaClass = section.slice(1).split("-")[0];
    var conjunction = "->"
    if (areaClass == "parameter") conjunction = "Value";
    $(section).append('<div class="d-flex align-items-center mt-1 ' + areaClass + '">' +
        '<label>' + name + '</label>' +
        '<input type="number" class="form-control is-valid" value="' + id + '" hidden>' +
        '<input type="text" class="form-control ' + isValid + '" onchange="setValue1(this)" value="' + value1 + '"required>' +
        '<div class="d-flex w-15 justify-content-center">' + conjunction + '</div>' +
        '<input type="text" class="form-control ' + isValid + '" onchange="setValue2(this)" value="' + value2 + '"required>' +
        '<button type="button" class="btn-close pl-1" onclick="deleteMappingItem(this)"></button></div>')
}

function saveNewConfig(elem) {
    if (elem.checked && config.id) {
        last_id = config.id;
        config.id = null;
    } else if (last_id) {
        config.id = last_id;
    }
    setFileName(document.getElementById('configname'));
}

function addConfig() {
    wrapper.configs.push(config);
    var message = config.message.message;
    if (config.message.active == "link") message = config.message.message_link;
    var tablerow = '<tr class="clickable-row">' + 
        '<th scope="row">' + (wrapper.configs.length).toString() + '</th>' +
        '<td>' + config.mapping.name + '</td>' +
        '<td>' + config.mapping.technique + '</td>' +
        '<td>' + message + '</td>' +
        '<td><select class="form-control is-valid"><option selected="selected">1tup</option><option>2tup</option><option>3tup</option>' +
        '<option>4tup</option><option>5tup</option></select></td>' + 
        '<td><select class="form-control is-valid" onchange="handleConstraintsSelector(this)"><option selected="selected">None</option><option>tcp</option><option>udp</option>' +
        '<option>tcp/udp</option><option>tls</option></select></td>' +
        '<td><input type="number" class="form-control is-valid" onchange="setNonNullableInteger(this, 0, 33)" min="1" step="1" max="32" value="1"required></td>' +
        '<td><div class="d-flex justify-content-center align-items-center">' +
        '<button type="button" class="btn btn-close mr-2" title="Remove wrapped config" onclick="removeWrappedConfig(this)"></button>' +
        '</div></td></tr>';
    $('#wrapper-body').append(tablerow);
}
/* ------------ END HELPER FUNC ------------ */