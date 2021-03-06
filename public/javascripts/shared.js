'use strict';

function getServer() {
  return location.protocol + '//' + location.hostname + ':' + location.port;
}

function logout()
{
  var logout_url = getServer() + '/session';
  $.ajax({
    type: "DELETE",
    url: logout_url,
    success: function(response_data)
    {
      if(response_data.status === 200 && response_data.message === "Session Deleted")
      {
        window.location.replace(getServer() + '/');
      }
      else {
        console.log("Error: " + response_data.message);
      }
    }
  });
}

var memberUrl = getServer()+'/member';

function GetInterests(member_interest_id)
{
  $("#member-modal-table-engagement-interests").empty();
  $.get(memberUrl+'/interests', function(data) {
    if (data.status === 200) {
      var $el = $("#member-modal-table-engagement-interests");
      $.each(data.interests, function(key,value) {
        if(value.id === member_interest_id)
        {
          $el.append($("<option selected></option>").attr("value", value.id).text(value.name));
        }
        else
        {
          $el.append($("<option></option>").attr("value", value.id).text(value.name));
        }
      });
      $('#member-modal-table-engagement-interests').selectpicker('refresh');
    }
  });
}

function GetPreferences(member_preference_id)
{
  $("#member-modal-table-communication-preferences").empty();
  $.get(memberUrl+'/preferences', function(data) {
    if (data.status === 200) {
      var $el = $("#member-modal-table-communication-preferences");
      $.each(data.preferences, function(key,value) {
        if(value.id === member_preference_id)
        {
          $el.append($("<option selected></option>").attr("value", value.id).text(value.name));
        }
        else
        {
          $el.append($("<option></option>").attr("value", value.id).text(value.name));
        }
      });
      $('#member-modal-table-communication-preferences').selectpicker('refresh');
    }
  });
}

function InitializeModalDatepicker() {
  $("#member-modal-table-last-contacted").datepicker();
  $("#member-modal-table-last-contacted").datepicker("option", "dateFormat", 'yy-mm-dd');
}

function ShowModal(member_info)
{
  GetPreferences(member_info.communication_preference_id);
  GetInterests(member_info.engagement_interest_id);
  InitializeModalDatepicker();

  if(!member_info.first_name)
  {
    if(curViewType === 2)
      $('#member-modal-title').html("New Participant");
  }
  else
  {
    $('#member-modal-title').html(member_info.first_name + "\'s Information");
  }
  $('#member-modal-table-first-name').val(member_info.first_name);
  $('#member-modal-table-last-name').val(member_info.last_name);
  $('#member-modal-table-email').val(member_info.email);
  $('#member-modal-table-phone').val(member_info.phone);
  $('#member-modal-table-address').val(member_info.address);
  $('#member-modal-table-company').val(member_info.company);
  if(member_info.last_contacted)
  {
    $('#member-modal-table-last-contacted').val(member_info.last_contacted.substring(0,10));
  }
  else
  {
    $('#member-modal-table-last-contacted').val('');
  }
  if(!member_info.communication_preference_id)
  {
    $('#member-modal-table-communication-preferences').val(0)
  }
  if(!member_info.engagement_interest_id)
  {
    $('#member-modal-table-engagement-interests').val(0);
  }
  $('#member-modal-save-button').removeAttr("onclick");
  $('#member-modal-save-button').attr( "onclick", "SaveMemberModalInfo(" + member_info.id + ");" );
  $('#member-modal').modal({
    backdrop: 'static',
    keyboard: false
  });
}

function SaveMemberModalInfo(member_id)
{
  if(member_id)
  {
    var info = {
      'type': curViewType,
      'id': member_id,
      'first_name': $('#member-modal-table-first-name').val(),
      'last_name': $('#member-modal-table-last-name').val(),
      'phone': $('#member-modal-table-phone').val(),
      'email': $('#member-modal-table-email').val(),
      'address': $('#member-modal-table-address').val(),
      'company': $('#member-modal-table-company').val(),
      'last_contacted': $('#member-modal-table-last-contacted').val(),
      'interest': $('#member-modal-table-engagement-interests').val(),
      'preference': $('#member-modal-table-communication-preferences').val()
    }

    console.log(info);

    $.ajax({
      type: "PUT",
      url:  getServer() + "/member/",
      data: info,
      success: function(response_data)
      {
        if(response_data.status === 200)
        {
          $('#member-modal').modal('hide');
          //Repopulate table
          RepopulateCurrentMemberTable();
        }
        else if(response_data.status === 400)
        {
          console.log("Incorrect input");
        }
        else if(response_data.status === 500)
        {
          console.log("Server Error");
        }
        else
        {
          console.log("Error: " + response_data.status);
        }

      }
    });
  }
  else
  {
    var memberUrl = getServer() + "/member/";
    var info = {
      'type': curViewType,
      'first_name': $('#member-modal-table-first-name').val(),
      'last_name': $('#member-modal-table-last-name').val(),
      'phone': $('#member-modal-table-phone').val(),
      'email': $('#member-modal-table-email').val(),
      'address': $('#member-modal-table-address').val(),
      'company': $('#member-modal-table-company').val(),
      'last_contacted': $('#member-modal-table-last-contacted').val(),
      'interest': $('#member-modal-table-engagement-interests').val(),
      'preference': $('#member-modal-table-communication-preferences').val()
    }


    console.log(info);

    $.ajax({
      type: "POST",
      url: memberUrl,
      data: info,
      success: function(response_data)
      {
        if(response_data.status === 201)
        {
          $('#member-modal').modal('hide');

          //Repopulate table
          RepopulateCurrentMemberTable();
        }
        else {
          //log error
          console.log("Error: " + response_data.message);
        }
      }
    });
  }

  function RepopulateCurrentMemberTable()
  {
    if(curViewType === 1)
    {
      //Remove all table rows and repopulate, no donor adding
      $('#current-member-table-body').remove();
      setup();
    }
    else if(curViewType === 2)
    {
      //Remove 2nd row and onward rows and repopulate, keep add row
      var i;
      for(i = document.getElementById('current-member-table-body').getElementsByTagName("tr").length - 1; i > 0; i--)
      {
        document.getElementById('current-member-table-body').deleteRow(i);
      }
      setup();
    }
    else
    {
        console.log("Error: curViewType = " + curViewType);
    }
  }
}
