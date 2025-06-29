function msgShow(retcode,msg) {
    if(retcode == 0) { var alertType = 'success';
    } else if(retcode == 2 || retcode == 1) {
        var alertType = 'danger';
    }
    var htmlMsg = '<div class="alert alert-'+alertType+' alert-dismissible" role="alert"><button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>'+msg+'</div>';
    return htmlMsg;
}

function createNetmaskAddr(bitCount) {
  var mask=[];
  for(i=0;i<4;i++) {
    var n = Math.min(bitCount, 8);
    mask.push(256 - Math.pow(2, 8-n));
    bitCount -= n;
  }
  return mask.join('.');
}

function loadSummary(strInterface) {
    var csrfToken = $('meta[name=csrf_token]').attr('content');
    $.post('ajax/networking/get_ip_summary.php',{'interface': strInterface, 'csrf_token': csrfToken},function(data){
        jsonData = JSON.parse(data);
        if(jsonData['return'] == 0) {
            $('#'+strInterface+'-summary').html(jsonData['output'].join('<br />'));
        } else if(jsonData['return'] == 2) {
            $('#'+strInterface+'-summary').append('<div class="alert alert-danger alert-dismissible" role="alert"><button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>'+jsonData['output'].join('<br />')+'</div>');
        }
    });
}

function getAllInterfaces() {
    $.get('ajax/networking/get_all_interfaces.php',function(data){
        jsonData = JSON.parse(data);
        $.each(jsonData,function(ind,value){
            loadSummary(value)
        });
    });
}

function setupTabs() {
    $('a[data-bs-toggle="tab"]').on('shown.bs.tab',function(e){
        var target = $(e.target).attr('href');
        if(!target.match('summary')) {
            var int = target.replace("#","");
            loadCurrentSettings(int);
        }
    });
}

$(document).on("click", ".js-add-dhcp-static-lease", function(e) {
    e.preventDefault();
    var container = $(".js-new-dhcp-static-lease");
    var mac = $("input[name=mac]", container).val().trim();
    var ip  = $("input[name=ip]", container).val().trim();
    var comment = $("input[name=comment]", container).val().trim();
    if (mac == "" || ip == "") {
        return;
    }
    var row = $("#js-dhcp-static-lease-row").html()
        .replace("{{ mac }}", mac)
        .replace("{{ ip }}", ip)
        .replace("{{ comment }}", comment);
    $(".js-dhcp-static-lease-container").append(row);

    $("input[name=mac]", container).val("");
    $("input[name=ip]", container).val("");
    $("input[name=comment]", container).val("");
});

$(document).on("click", ".js-remove-dhcp-static-lease", function(e) {
    e.preventDefault();
    $(this).parents(".js-dhcp-static-lease-row").remove();
});

$(document).on("submit", ".js-dhcp-settings-form", function(e) {
    $(".js-add-dhcp-static-lease").trigger("click");
});

$(document).on("click", ".js-add-dhcp-upstream-server", function(e) {
    e.preventDefault();

    var field = $("#add-dhcp-upstream-server-field")
    var row = $("#dhcp-upstream-server").html().replace("{{ server }}", field.val())

    if (field.val().trim() == "") { return }

    $(".js-dhcp-upstream-servers").append(row)

    field.val("")
});

$(document).on("click", ".js-remove-dhcp-upstream-server", function(e) {
    e.preventDefault();
    $(this).parents(".js-dhcp-upstream-server").remove();
});

$(document).on("submit", ".js-dhcp-settings-form", function(e) {
    $(".js-add-dhcp-upstream-server").trigger("click");
});

/**
 * mark a form field, e.g. a select box, with the class `.js-field-preset`
 * and give it an attribute `data-field-preset-target` with a text field's
 * css selector.
 *
 * now, if the element marked `.js-field-preset` receives a `change` event,
 * its value will be copied to all elements matching the selector in
 * data-field-preset-target.
 */
$(document).on("change", ".js-field-preset", function(e) {
    var selector = this.getAttribute("data-field-preset-target")
    var value = "" + this.value
    var syncValue = function(el) { el.value = value }

    if (value.trim() === "") { return }

    document.querySelectorAll(selector).forEach(syncValue)
});

$(document).on("click", "#gen_wpa_passphrase", function(e) {
    $('#txtwpapassphrase').val(genPassword(63));
});

$(document).on("click", "#gen_apikey", function(e) {
    $('#txtapikey').val(genPassword(32).toLowerCase());
});

$(document).on("click", "#js-clearhostapd-log", function(e) {
    var csrfToken = $('meta[name=csrf_token]').attr('content');
    $.post('ajax/logging/clearlog.php?',{'logfile':'/tmp/hostapd.log', 'csrf_token': csrfToken},function(data){
        jsonData = JSON.parse(data);
        $("#hostapd-log").val("");
    });
});

$(document).on("click", "#js-cleardnsmasq-log", function(e) {
    var csrfToken = $('meta[name=csrf_token]').attr('content');
    $.post('ajax/logging/clearlog.php?',{'logfile':'/var/log/dnsmasq.log', 'csrf_token': csrfToken},function(data){
        jsonData = JSON.parse(data);
        $("#dnsmasq-log").val("");
    });
});

$(document).on("click", "#js-clearopenvpn-log", function(e) {
    var csrfToken = $('meta[name=csrf_token]').attr('content');
    $.post('ajax/logging/clearlog.php?',{'logfile':'/tmp/openvpn.log', 'csrf_token': csrfToken},function(data){
        jsonData = JSON.parse(data);
        $("#openvpn-log").val("");
    });
});


// Enable Bootstrap tooltips
$(function () {
  $('[data-bs-toggle="tooltip"]').tooltip()
})

function genPassword(pwdLen) {
    var pwdChars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    var rndPass = Array(pwdLen).fill(pwdChars).map(function(x) { return x[Math.floor(Math.random() * x.length)] }).join('');
    return rndPass;
}

function setupBtns() {
    $('#btnSummaryRefresh').click(function(){getAllInterfaces();});
    $('.intsave').click(function(){
        var int = $(this).data('int');
        saveNetworkSettings(int);
    });
    $('.intapply').click(function(){
        applyNetworkSettings();
    });
}

function setCSRFTokenHeader(event, xhr, settings) {
    var csrfToken = $('meta[name=csrf_token]').attr('content');
    if (/^(POST|PATCH|PUT|DELETE)$/i.test(settings.type)) {
        xhr.setRequestHeader("X-CSRF-Token", csrfToken);
    }
}

function contentLoaded() {
    pageCurrent = window.location.href.split("/").pop();
    switch(pageCurrent) {
        case "network_conf":
            getAllInterfaces();
            setupTabs();
            setupBtns();
            break;
        case "hostapd_conf":
            getChannel();
            setHardwareModeTooltip();
            break;
        case "dhcpd_conf":
            loadInterfaceDHCPSelect();
        break;
    }
}

function loadWifiStations(refresh) {
    return function() {
        var complete = function() { $(this).removeClass('loading-spinner'); }
        var qs = refresh === true ? '?refresh' : '';
        $('.js-wifi-stations')
            .addClass('loading-spinner')
            .empty()
            .load('ajax/networking/wifi_stations.php'+qs, complete);
    };
}
$(".js-reload-wifi-stations").on("click", loadWifiStations(true));

/*
Populates the DHCP server form fields
Option toggles are set dynamically depending on the loaded configuration
*/
function loadInterfaceDHCPSelect() {
    var strInterface = $('#cbxdhcpiface').val();
    var csrfToken = $('meta[name=csrf_token]').attr('content');
    $.post('ajax/networking/get_netcfg.php', {'iface' : strInterface, 'csrf_token': csrfToken}, function(data){
        jsonData = JSON.parse(data);
        $('#dhcp-iface')[0].checked = jsonData.DHCPEnabled;
        $('#txtipaddress').val(jsonData.StaticIP);
        $('#txtsubnetmask').val(jsonData.SubnetMask);
        $('#txtgateway').val(jsonData.StaticRouters);
        $('#chkfallback')[0].checked = jsonData.FallbackEnabled;
        $('#default-route').prop('checked', jsonData.DefaultRoute);
        if (strInterface.startsWith("wl")) {
            $('#nohook-wpa-supplicant').parent().parent().parent().show()
            $('#nohook-wpa-supplicant').prop('checked', jsonData.NoHookWPASupplicant);
        } else {
            $('#nohook-wpa-supplicant').parent().parent().parent().hide()
        }
        $('#txtrangestart').val(jsonData.RangeStart);
        $('#txtrangeend').val(jsonData.RangeEnd);
        $('#txtrangeleasetime').val(jsonData.leaseTime);
        $('#txtdns1').val(jsonData.DNS1);
        $('#txtdns2').val(jsonData.DNS2);
        $('#cbxrangeleasetimeunits').val(jsonData.leaseTimeInterval);
        $('#no-resolv')[0].checked = jsonData.upstreamServersEnabled;
        $('#cbxdhcpupstreamserver').val(jsonData.upstreamServers[0]);
        $('#txtmetric').val(jsonData.Metric);

        if (jsonData.StaticIP !== null && jsonData.StaticIP !== '' && !jsonData.FallbackEnabled) {
            $('#chkstatic').prop('checked', true).closest('.btn').addClass('active');
            $('#chkdhcp').prop('checked', false).closest('.btn').removeClass('active');
            $('#chkfallback').prop('disabled', true);
            $('#dhcp-iface').removeAttr('disabled');
        } else {
            $('#chkdhcp').closest('.btn').addClass('active');
            $('#chkdhcp').closest('.btn').button.blur();
        }
        if (jsonData.FallbackEnabled || $('#chkdhcp').is(':checked')) {
            $('#dhcp-iface').prop('disabled', true);
            setDhcpFieldsDisabled();
        }
    });
}

function setDHCPToggles(state) {
    if ($('#chkfallback').is(':checked') && state) {
        $('#chkfallback').prop('checked', state);
    }
    if ($('#dhcp-iface').is(':checked') && !state) {
        $('#dhcp-iface').prop('checked', state);
        setDhcpFieldsDisabled();
    }
    $('#chkfallback').prop('disabled', state);
    $('#dhcp-iface').prop('disabled', !state);
}

$('#chkfallback').change(function() {
    if ($('#chkfallback').is(':checked')) {
        setStaticFieldsEnabled();
    } else {
        setStaticFieldsDisabled();
    }
});

$('#debugModal').on('shown.bs.modal', function (e) {
  var csrfToken = $('meta[name=csrf_token]').attr('content');
  $.post('ajax/system/sys_debug.php',{'csrf_token': csrfToken},function(data){
        window.location.replace('/ajax/system/sys_get_logfile.php');
        $('#debugModal').modal('hide');
    });
});

$('#chkupdateModal').on('shown.bs.modal', function (e) {
  var csrfToken = $('meta[name=csrf_token]').attr('content');
  $.post('ajax/system/sys_chk_update.php',{'csrf_token': csrfToken},function(data){
        var response = JSON.parse(data);
        var tag = response.tag;
        var update = response.update;
        var msg;
        var msgUpdate = $('#msgUpdate').data('message');
        var msgLatest = $('#msgLatest').data('message');
        var msgInstall = $('#msgInstall').data('message');
        var msgDismiss = $('#js-check-dismiss').data('message');
        var faCheck = '<i class="fas fa-check ms-2"></i><br />';
        $("#updateSync").removeClass("fa-spin");
        if (update === true) {
            msg = msgUpdate +' '+tag;
            $("#msg-check-update").html(msg);
            $("#msg-check-update").append(faCheck);
            $("#msg-check-update").append("<p>"+msgInstall+"</p>");
            $("#js-sys-check-update").removeClass("collapse");
        } else {
            msg = msgLatest;
            dismiss = $("#js-check-dismiss");
            $("#msg-check-update").html(msg);
            $("#msg-check-update").append(faCheck);
            $("#js-sys-check-update").remove();
            dismiss.text(msgDismiss);
            dismiss.removeClass("btn-outline-secondary");
            dismiss.addClass("btn-primary");
        }
    });
});

$('#performUpdate').on('submit', function(event) {
    event.preventDefault();
    var csrfToken = $('meta[name=csrf_token]').attr('content');
    $.post('ajax/system/sys_perform_update.php',{
        'csrf_token': csrfToken
    })
    $('#chkupdateModal').modal('hide');
    $('#performupdateModal').modal('show');
});

$('#performupdateModal').on('shown.bs.modal', function (e) {
    fetchUpdateResponse();
});

function fetchUpdateResponse() {
    const complete = 6;
    const error = 7;
    let phpFile = 'ajax/system/sys_read_logfile.php';

    $.ajax({
        url: phpFile,
        type: 'GET',
        success: function(response) { 
            for (let i = 1; i <= 6; i++) {
                let divId = '#updateStep' + i;
                if (response.includes(i.toString())) {
                    $(divId).removeClass('invisible');
                }
            }
            // check if the update is complete or if there's an error
            if (response.includes(complete)) {
                var successMsg = $('#successMsg').data('message');
                $('#updateMsg').after('<span class="small">' + successMsg + '</span>');
                $('#updateMsg').addClass('fa-check');
                $('#updateMsg').removeClass('invisible');
                $('#updateStep6').removeClass('invisible');
                $('#updateSync2').removeClass("fa-spin");
                $('#updateOk').removeAttr('disabled');
            } else if (response.includes(error)) {
                var errorMsg = $('#errorMsg').data('message');
                $('#updateMsg').after('<span class="small">' + errorMsg + '</span>');
                $('#updateMsg').addClass('fa-times');
                $('#updateMsg').removeClass('invisible');
                $('#updateSync2').removeClass("fa-spin");
                $('#updateOk').removeAttr('disabled');
            } else {
                setTimeout(fetchUpdateResponse, 500);
            }
        },
        error: function(xhr, status, error) {
            console.error("AJAX Error:", error);
        }
    });
}

$('#hostapdModal').on('shown.bs.modal', function (e) {
    var seconds = 3;
    var pct = 0;
    var countDown = setInterval(function(){
      if(seconds <= 0){
        clearInterval(countDown);
      }
      document.getElementsByClassName('progress-bar').item(0).setAttribute('style','width:'+Number(pct)+'%');
      seconds --;
      pct = Math.floor(100-(seconds*100/4));
    }, 500);
});

$('#configureClientModal').on('shown.bs.modal', function (e) {
});

$('#ovpn-confirm-delete').on('click', '.btn-delete', function (e) {
    var cfg_id = $(this).data('recordId');
    var csrfToken = $('meta[name=csrf_token]').attr('content');
    $.post('ajax/openvpn/del_ovpncfg.php',{'cfg_id':cfg_id, 'csrf_token': csrfToken},function(data){
        jsonData = JSON.parse(data);
        $("#ovpn-confirm-delete").modal('hide');
        var row = $(document.getElementById("openvpn-client-row-" + cfg_id));
        row.fadeOut( "slow", function() {
            row.remove();
        });
    });
});

$('#ovpn-confirm-delete').on('show.bs.modal', function (e) {
    var data = $(e.relatedTarget).data();
    $('.btn-delete', this).data('recordId', data.recordId);
});

$('#ovpn-confirm-activate').on('click', '.btn-activate', function (e) {
    var cfg_id = $(this).data('record-id');
    var csrfToken = $('meta[name=csrf_token]').attr('content');
    $.post('ajax/openvpn/activate_ovpncfg.php',{'cfg_id':cfg_id, 'csrf_token': csrfToken},function(data){
        jsonData = JSON.parse(data);
        $("#ovpn-confirm-activate").modal('hide');
        setTimeout(function(){
            window.location.reload();
        },300);
    });
});

$('#ovpn-confirm-activate').on('shown.bs.modal', function (e) {
    var data = $(e.relatedTarget).data();
    $('.btn-activate', this).data('recordId', data.recordId);
});

$('#ovpn-userpw,#ovpn-certs').on('click', function (e) {
    if (this.id == 'ovpn-userpw') {
        $('#PanelCerts').hide();
        $('#PanelUserPW').show();
    } else if (this.id == 'ovpn-certs') {
        $('#PanelUserPW').hide();
        $('#PanelCerts').show();
    }
});

$('#js-system-reset-confirm').on('click', function (e) {
    var progressText = $('#js-system-reset-confirm').attr('data-message');
    var successHtml = $('#system-reset-message').attr('data-message');
    var closeHtml = $('#js-system-reset-cancel').attr('data-message');
    var csrfToken = $('meta[name=csrf_token]').attr('content');
    var progressHtml = $('<div>').text(progressText).html() + '<i class="fas fa-cog fa-spin ms-2"></i>';
    $('#system-reset-message').html(progressHtml);
    $.post('ajax/networking/do_sys_reset.php?',{'csrf_token':csrfToken},function(data){
        setTimeout(function(){
            jsonData = JSON.parse(data);
            if(jsonData['return'] == 0) {
                $('#system-reset-message').text(successHtml);
            } else {
                $('#system-reset-message').text('Error occured: '+ jsonData['return']);
            }
            $("#js-system-reset-confirm").hide();
            $("#js-system-reset-cancel").text(closeHtml);
        },750);
    });
});

$('#js-sys-reboot, #js-sys-shutdown').on('click', function (e) {
    e.preventDefault();
    var csrfToken = $('meta[name=csrf_token]').attr('content');
    var action = $(this).data('action');
    $.post('ajax/system/sys_actions.php?',{'a': action, 'csrf_token': csrfToken},function(data){
        var response = JSON.parse(data);
    });
});

$('#install-user-plugin').on('shown.bs.modal', function (e) {
    var button = $(e.relatedTarget);
    $(this).data('button', button);
    var manifestData = button.data('plugin-manifest');
    var installed = button.data('plugin-installed') || false;
    var repoPublic = button.data('repo-public') || false;
    var installPath = manifestData.install_path;

    if (!installed && repoPublic && installPath === 'plugins-available') {
        insidersHTML = 'Available with <i class="fas fa-heart heart me-1"></i><a href="https://docs.raspap.com/insiders" target="_blank" rel="noopener">Insiders</a>';
        $('#plugin-additional').html(insidersHTML);
    } else {
        $('#plugin-additional').empty();
    }
    if (manifestData) {
        $('#plugin-docs').html(manifestData.plugin_docs
            ? `<a href="${manifestData.plugin_docs}" target="_blank">${manifestData.plugin_docs}</a>`
            : 'Unknown');
        $('#plugin-icon').attr('class', `${manifestData.icon || 'fas fa-plug'} link-secondary h5 me-2`);
        $('#plugin-name').text(manifestData.name || 'Unknown');
        $('#plugin-version').text(manifestData.version || 'Unknown');
        $('#plugin-description').text(manifestData.description || 'No description provided');
        $('#plugin-author').html(manifestData.author
            ? manifestData.author + (manifestData.author_uri
            ? ` (<a href="${manifestData.author_uri}" target="_blank">profile</a>)` : '') : 'Unknown');
        $('#plugin-license').text(manifestData.license || 'Unknown');
        $('#plugin-locale').text(manifestData.default_locale || 'Unknown');
        $('#plugin-configuration').html(formatProperty(manifestData.configuration || 'None'));
        $('#plugin-packages').html(formatProperty(manifestData.keys || 'None'));
        $('#plugin-dependencies').html(formatProperty(manifestData.dependencies || 'None'));
        $('#plugin-javascript').html(formatProperty(manifestData.javascript || 'None'));
        $('#plugin-sudoers').html(formatProperty(manifestData.sudoers || 'None'));
        $('#plugin-user-name').html((manifestData.user_nonprivileged && manifestData.user_nonprivileged.name) || 'None');
    }
    if (installed) {
        $('#js-install-plugin-confirm').html('OK');
    } else if (!installed && repoPublic && installPath == 'plugins-available') {
        $('#js-install-plugin-confirm').html('Get Insiders');
    } else {
        $('#js-install-plugin-confirm').html('Install now');
    }
});

$('#js-install-plugin-confirm').on('click', function (e) {
    var button = $('#install-user-plugin').data('button');
    var manifestData = button.data('plugin-manifest');
    var installPath = manifestData.install_path;
    var pluginUri = manifestData.plugin_uri;
    var pluginVersion = manifestData.version;
    var pluginConfirm = $('#js-install-plugin-confirm').text();
    var progressText = $('#js-install-plugin-confirm').attr('data-message');
    var successHtml = $('#plugin-install-message').attr('data-message');
    var successText = $('<div>').text(successHtml).text();
    var csrfToken = $('meta[name=csrf_token]').attr('content');

    if (pluginConfirm  === 'Install now') {
        $("#install-user-plugin").modal('hide');
        $("#install-plugin-progress").modal('show');
        $.post(
            'ajax/plugins/do_plugin_install.php',
            {
                'plugin_uri': pluginUri,
                'plugin_version': pluginVersion,
                'install_path': installPath,
                'csrf_token': csrfToken
            },
            function (data) {
                setTimeout(function () {
                    response = JSON.parse(data);
                    if (response === true) {
                        $('#plugin-install-message').contents().first().text(successText);
                        $('#plugin-install-message')
                            .find('i')
                            .removeClass('fas fa-cog fa-spin link-secondary')
                            .addClass('fas fa-check');
                        $('#js-install-plugin-ok').removeAttr("disabled");
                    } else {
                        const errorMessage = jsonData.error || 'An unknown error occurred.';
                        var errorLog = '<textarea class="plugin-log text-secondary" readonly>' + errorMessage + '</textarea>';
                        $('#plugin-install-message')
                            .contents()
                            .first()
                            .replaceWith('An error occurred installing the plugin:');
                        $('#plugin-install-message').append(errorLog);
                        $('#plugin-install-message').find('i').removeClass('fas fa-cog fa-spin link-secondary');
                        $('#js-install-plugin-ok').removeAttr("disabled");
                    }
                }, 200);
            }
        ).fail(function (xhr) {
            const jsonData = JSON.parse(xhr.responseText);
            const errorMessage = jsonData.error || 'An unknown error occurred.';
            $('#plugin-install-message')
                .contents()
                .first()
                .replaceWith('An error occurred installing the plugin:');
            var errorLog = '<textarea class="plugin-log text-secondary" readonly>' + errorMessage + '</textarea>';
            $('#plugin-install-message').append(errorLog);
            $('#plugin-install-message').find('i').removeClass('fas fa-cog fa-spin link-secondary');
            $('#js-install-plugin-ok').removeAttr("disabled");
        });
    } else if (pluginConfirm  === 'Get Insiders') {
        window.open('https://docs.raspap.com/insiders/', '_blank');
        return;
    } else if (pluginConfirm === 'OK') {
        $("#install-user-plugin").modal('hide');
    }
});

$('#js-install-plugin-ok').on('click', function (e) {
    $("#install-plugin-progress").modal('hide');
    window.location.reload();
});

function formatProperty(prop) {
    if (Array.isArray(prop)) {
        if (typeof prop[0] === 'object') {
            return prop.map(item => {
                return Object.entries(item)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join('<br/>');
            }).join('<br/>');
        }
        return prop.map(line => `${line}<br/>`).join('');
    }
    if (typeof prop === 'object') {
        return Object.entries(prop)
            .map(([key, value]) => `${key}: ${value}`)
            .join('<br/>');
    }
    return prop || 'None';
}

$(document).ready(function(){
    $("#PanelManual").hide();
    $('.ip_address').mask('0ZZ.0ZZ.0ZZ.0ZZ', {
        translation: {
            'Z': {
                pattern: /[0-9]/, optional: true
            }
        },
        placeholder: "___.___.___.___"
    });
    $('.date').mask('FF:FF:FF:FF:FF:FF', {
        translation: {
            "F": {
                pattern: /[0-9a-z]/, optional: true
            }
        },
        placeholder: "__:__:__:__:__:__"
    });
});

$(document).ready(function() {
    $('.cidr').mask('099.099.099.099/099', {
        translation: {
            '0': { pattern: /[0-9]/ }
        },
        placeholder: "___.___.___.___/___"
    });
});

$('#wg-upload,#wg-manual').on('click', function (e) {
    if (this.id == 'wg-upload') {
        $('#PanelManual').hide();
        $('#PanelUpload').show();
    } else if (this.id == 'wg-manual') {
        $('#PanelUpload').hide();
        $('#PanelManual').show();
    }
});

$(".custom-file-input").on("change", function() {
  var fileName = $(this).val().split("\\").pop();
  $(this).siblings(".custom-file-label").addClass("selected").html(fileName);
});

 // Retrieves the 'channel' value specified in hostapd.conf
function getChannel() {
    $.get('ajax/networking/get_channel.php',function(data){
        jsonData = JSON.parse(data);
        loadChannelSelect(jsonData);
    });
}

/*
 Sets the wirelss channel select options based on frequencies reported by iw.

 See: https://git.kernel.org/pub/scm/linux/kernel/git/sforshee/wireless-regdb.git
 Also: https://en.wikipedia.org/wiki/List_of_WLAN_channels
*/
function loadChannelSelect(selected) {
    var iface = $('#cbxinterface').val();
    var hwmodeText = '';
    var csrfToken = $('meta[name=csrf_token]').attr('content');

    // update hardware mode tooltip
    setHardwareModeTooltip();

    $.post('ajax/networking/get_frequencies.php',{'interface': iface, 'csrf_token': csrfToken, 'selected': selected},function(response){
        var hw_mode = $('#cbxhwmode').val();
        var country_code = $('#cbxcountries').val();
        var channel_select = $('#cbxchannel');
        var btn_save = $('#btnSaveHostapd');
        var data = JSON.parse(response);
        var selectableChannels = [];

        // Map selected hw_mode to available channels
        if (hw_mode === 'a') {
            selectableChannels = data.filter(item => item.MHz.toString().startsWith('5'));
        } else if (hw_mode !== 'ac') {
            selectableChannels = data.filter(item => item.MHz.toString().startsWith('24'));
        } else if (hw_mode === 'b') {
            selectableChannels = data.filter(item => item.MHz.toString().startsWith('24'));
        } else if (hw_mode === 'ac') {
            selectableChannels = data.filter(item => item.MHz.toString().startsWith('5'));
        }

        // If selected channel doeesn't exist in allowed channels, set default or null (unsupported)
        if (!selectableChannels.find(item => item.Channel === selected)) {
            if (selectableChannels.length === 0) {
                selectableChannels[0] = { Channel: null };
            } else {
                defaultChannel = selectableChannels[0].Channel;
                selected = defaultChannel
            }
        }

        // Set channel select with available values
        channel_select.empty();
        if (selectableChannels[0].Channel === null) {
            channel_select.append($("<option></option>").attr("value", "").text("---"));
            channel_select.prop("disabled", true);
            btn_save.prop("disabled", true);
        } else {
            channel_select.prop("disabled", false);
            btn_save.prop("disabled", false);
            $.each(selectableChannels, function(key,value) {
                channel_select.append($("<option></option>").attr("value", value.Channel).text(value.Channel));
            });
            channel_select.val(selected);
        }
    });
}

/* Sets hardware mode tooltip text for selected interface
 * and calls loadChannelSelect()
 */
function setHardwareModeTooltip() {
    var iface = $('#cbxinterface').val();
    var hwmodeText = '';
    var csrfToken = $('meta[name=csrf_token]').attr('content');
    // Explanatory text if 802.11ac is disabled
    if ($('#cbxhwmode').find('option[value="ac"]').prop('disabled') == true ) {
        var hwmodeText = $('#hwmode').attr('data-tooltip');
    }
    $.post('ajax/networking/get_nl80211_band.php?',{'interface': iface, 'csrf_token': csrfToken},function(data){
        var responseText = JSON.parse(data);
        $('#tiphwmode').attr('data-original-title', responseText + '\n' + hwmodeText );
    });
}

/* Updates the selected blocklist
 * Request is passed to an ajax handler to download the associated list.
 * Interface elements are updated to indicate current progress, status.
 */
function updateBlocklist() {
    const opt = $('#cbxblocklist option:selected');
    const blocklist_id = opt.val();
    const csrfToken = $('meta[name=csrf_token]').attr('content');

    if (blocklist_id === '') return;

    const statusIcon = $('#cbxblocklist-status').find('i');
    const statusWrapper = $('#cbxblocklist-status');

    statusIcon.removeClass('fa-check fa-exclamation-triangle').addClass('fa-cog fa-spin');
    statusWrapper.removeClass('check-hidden check-error check-updated').addClass('check-progress');

    $.post('ajax/adblock/update_blocklist.php', {
        'blocklist_id': blocklist_id,
        'csrf_token': csrfToken
    }, function (data) {
        let jsonData;
        try {
            jsonData = JSON.parse(data);
        } catch (e) {
            showError("Unexpected server response.");
            return;
        }
        const resultCode = jsonData['return'];
        const output = jsonData['output']?.join('\n') || '';

        switch (resultCode) {
            case 0:
                statusIcon.removeClass('fa-cog fa-spin').addClass('fa-check');
                statusWrapper.removeClass('check-progress').addClass('check-updated').delay(500).animate({ opacity: 1 }, 700);
                $('#blocklist-' + jsonData['list']).text("Just now");
                break;
            case 1:
                showError("Invalid blocklist.");
                break;
            case 2:
                showError("No blocklist provided.");
                break;
            case 3:
                showError("Could not parse blocklists.json.");
                break;
            case 4:
                showError("blocklists.json file not found.");
                break;
            case 5:
                showError("Update script not found.");
                break;
            default:
                showError("Unknown error occurred.");
        }
    }).fail(function (jqXHR, textStatus, errorThrown) {
        showError(`AJAX request failed: ${textStatus}`);
    });

    function showError(message) {
        statusIcon.removeClass('fa-cog fa-spin').addClass('fa-exclamation-triangle');
        statusWrapper.removeClass('check-progress').addClass('check-error');
        alert("Blocklist update failed:\n\n" + message);
    }
}

function clearBlocklistStatus() {
    $('#cbxblocklist-status').removeClass('check-updated').addClass('check-hidden');
}

// Handler for the WireGuard generate key button
$('.wg-keygen').click(function(){
    var parentGroup = $(this).closest('.input-group');
    var entity_pub = parentGroup.find('input[type="text"]');
    var updated = entity_pub.attr('name')+"-pubkey-status";
    var csrfToken = $('meta[name="csrf_token"]').attr('content');
    $.post('ajax/networking/get_wgkey.php',{'entity':entity_pub.attr('name'), 'csrf_token': csrfToken},function(data){
        var jsonData = JSON.parse(data);
        entity_pub.val(jsonData.pubkey);
        $('#' + updated).removeClass('check-hidden').addClass('check-updated').delay(500).animate({ opacity: 1 }, 700);
    });
});

// Handler for wireguard client.conf download
$('.wg-client-dl').click(function(){
    var req = new XMLHttpRequest();
    var url = 'ajax/networking/get_wgcfg.php';
    req.open('get', url, true);
    req.responseType = 'blob';
    req.setRequestHeader('Content-type', 'text/plain; charset=UTF-8');
    req.onreadystatechange = function (event) {
        if(req.readyState == 4 && req.status == 200) {
            var blob = req.response;
            var link=document.createElement('a');
            link.href=window.URL.createObjectURL(blob);
            link.download = 'client.conf';
            link.click();
        }
    }
    req.send();
})

// Event listener for Bootstrap's form validation
window.addEventListener('load', function() {
    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    var forms = document.getElementsByClassName('needs-validation');
    // Loop over them and prevent submission
    var validation = Array.prototype.filter.call(forms, function(form) {
        form.addEventListener('submit', function(event) {
          if (form.checkValidity() === false) {
            event.preventDefault();
            event.stopPropagation();
          }
          form.classList.add('was-validated');
        }, false);
    });
}, false);

let sessionCheckInterval = setInterval(checkSession, 5000);

function checkSession() {
    // skip session check if on login page
    if (window.location.pathname === '/login') {
        return;
    }
    var csrfToken = $('meta[name=csrf_token]').attr('content');
    $.post('ajax/session/do_check_session.php',{'csrf_token': csrfToken},function (data) {
        if (data.status === 'session_expired') {
            clearInterval(sessionCheckInterval);
            showSessionExpiredModal();
        }
    }).fail(function (jqXHR, status, err) {
        console.error("Error checking session status:", status, err);
    });
}

function showSessionExpiredModal() {
    $('#sessionTimeoutModal').modal('show');
}

$(document).on("click", "#js-session-expired-login", function(e) {
    const loginModal = $('#modal-admin-login');
    const redirectUrl = window.location.pathname;
    window.location.href = `/login?action=${encodeURIComponent(redirectUrl)}`;
});

// show modal login on page load
$(document).ready(function () {
    const params = new URLSearchParams(window.location.search);
    const redirectUrl = $('#redirect-url').val() || params.get('action') || '/';
    $('#modal-admin-login').modal('show');
    $('#redirect-url').val(redirectUrl);
    $('#username').focus();
    $('#username').addClass("focusedInput");
});

// DHCP or Static IP option group
$('#chkstatic').on('change', function() {
    if (this.checked) {
        setStaticFieldsEnabled();
    }
});

$('#chkdhcp').on('change', function() {
    this.checked ? setStaticFieldsDisabled() : null;
});


$('input[name="dhcp-iface"]').change(function() {
    if ($('input[name="dhcp-iface"]:checked').val() == '1') {
        setDhcpFieldsEnabled();
    } else {
        setDhcpFieldsDisabled();
    }
});


function setStaticFieldsEnabled() {
    $('#txtipaddress').prop('required', true);
    $('#txtsubnetmask').prop('required', true);
    $('#txtgateway').prop('required', true);

    $('#txtipaddress').removeAttr('disabled');
    $('#txtsubnetmask').removeAttr('disabled');
    $('#txtgateway').removeAttr('disabled');
}

function setStaticFieldsDisabled() {
    $('#txtipaddress').prop('disabled', true);
    $('#txtsubnetmask').prop('disabled', true);
    $('#txtgateway').prop('disabled', true);

    $('#txtipaddress').removeAttr('required');
    $('#txtsubnetmask').removeAttr('required');
    $('#txtgateway').removeAttr('required');
}

function setDhcpFieldsEnabled() {
    $('#txtrangestart').prop('required', true);
    $('#txtrangeend').prop('required', true);
    $('#txtrangeleasetime').prop('required', true);
    $('#cbxrangeleasetimeunits').prop('required', true);

    $('#txtrangestart').removeAttr('disabled');
    $('#txtrangeend').removeAttr('disabled');
    $('#txtrangeleasetime').removeAttr('disabled');
    $('#cbxrangeleasetimeunits').removeAttr('disabled');
    $('#txtdns1').removeAttr('disabled');
    $('#txtdns2').removeAttr('disabled');
    $('#txtmetric').removeAttr('disabled');
}

function setDhcpFieldsDisabled() {
    $('#txtrangestart').removeAttr('required');
    $('#txtrangeend').removeAttr('required');
    $('#txtrangeleasetime').removeAttr('required');
    $('#cbxrangeleasetimeunits').removeAttr('required');

    $('#txtrangestart').prop('disabled', true);
    $('#txtrangeend').prop('disabled', true);
    $('#txtrangeleasetime').prop('disabled', true);
    $('#cbxrangeleasetimeunits').prop('disabled', true);
    $('#txtdns1').prop('disabled', true);
    $('#txtdns2').prop('disabled', true);
    $('#txtmetric').prop('disabled', true);
}

// Static Array method
Array.range = (start, end) => Array.from({length: (end - start)}, (v, k) => k + start);

$(document).on("click", ".js-toggle-password", function(e) {
    var button = $(e.currentTarget);
    var field  = $(button.data("bsTarget"));
    if (field.is(":input")) {
        e.preventDefault();

        if (!button.data("__toggle-with-initial")) {
            $("i", button).removeClass("fas fa-eye").addClass(button.attr("data-toggle-with"));
        }

        if (field.attr("type") === "password") {
            field.attr("type", "text");
        } else {
            $("i", button).removeClass("fas fa-eye-slash").addClass("fas fa-eye");
            field.attr("type", "password");
        }
    }
});

$(function() {
    $('#theme-select').change(function() {
        var theme = themes[$( "#theme-select" ).val() ];

        var hasDarkTheme = theme === 'custom.php';
        var nightModeChecked = $("#night-mode").prop("checked");
        
        if (nightModeChecked && hasDarkTheme) {
            if (theme === "custom.php") {
                set_theme("dark.css");
            }
        } else {
            set_theme(theme);
        }
   });
});

function set_theme(theme) {
    $('link[title="main"]').attr('href', 'app/css/' + theme);
    // persist selected theme in cookie 
    setCookie('theme',theme,90);
}

$(function() {
    var currentTheme = getCookie('theme');
    // Check if the current theme is a dark theme
    var isDarkTheme = currentTheme === 'dark.css';

    $('#night-mode').prop('checked', isDarkTheme);
    $('#night-mode').change(function() {
        var state = $(this).is(':checked');
        var currentTheme = getCookie('theme');
        
        if (state == true) {
            if (currentTheme == 'custom.php') {
                set_theme('dark.css');
            }
        } else {
            if (currentTheme == 'dark.css') {
                set_theme('custom.php');
            }
        }
   });
});

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    var regx = new RegExp(cname + "=([^;]+)");
    var value = regx.exec(document.cookie);
    return (value != null) ? unescape(value[1]) : null;
}

// Define themes
var themes = {
    "default": "custom.php",
    "hackernews" : "hackernews.css"
}

// Adds active class to current nav-item
$(window).bind("load", function() {
    var url = window.location;
    $('.sb-nav-link-icon a').filter(function() {
      return this.href == url;
    }).parent().addClass('active');
});

// Sets focus on a specified tab
document.addEventListener("DOMContentLoaded", function () {
    const params = new URLSearchParams(window.location.search);
    const targetTab = params.get("tab");
    if (targetTab) {
        let tabElement = document.querySelector(`[data-bs-toggle="tab"][href="#${targetTab}"]`);
        if (tabElement) {
            let tab = new bootstrap.Tab(tabElement);
            tab.show();
        }
    }
});

function disableValidation(form) {
    form.removeAttribute("novalidate");
    form.classList.remove("needs-validation");
    form.querySelectorAll("[required]").forEach(function (field) {
        field.removeAttribute("required");
    });
}

function updateActivityLED() {
  const threshold_bytes = 300;
  fetch('/app/net_activity')
    .then(res => res.text())
    .then(data => {
      const activity = parseInt(data.trim());
      const leds = document.querySelectorAll('.hostapd-led');

      if (!isNaN(activity)) {
        leds.forEach(led => {
          if (activity > threshold_bytes) {
            led.classList.add('led-pulse');
            setTimeout(() => {
              led.classList.remove('led-pulse');
            }, 50);
          } else {
            led.classList.remove('led-pulse');
          }
        });
      }
    })
    .catch(() => { /* ignore fetch errors */ });
}
setInterval(updateActivityLED, 100);

$(document).ready(function() {
    const $htmlElement = $('html');
    const $modeswitch = $('#night-mode');
    $modeswitch.on('change', function() {
        const isChecked = $(this).is(':checked');
        const newTheme = isChecked ? 'dark' : 'light';
        $htmlElement.attr('data-bs-theme', newTheme);
        localStorage.setItem('bsTheme', newTheme);
    });
});

$(document)
    .ajaxSend(setCSRFTokenHeader)
    .ready(contentLoaded)
    .ready(loadWifiStations());
