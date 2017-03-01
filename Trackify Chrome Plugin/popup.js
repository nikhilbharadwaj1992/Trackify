chrome.runtime.onMessage.addListener(function(request, sender) {
  if (request.action == "getSource") {
    var html = request.source;    
    //Setting Scraped Data to Window Object to access it across
    window.candidate = getCandidate(html);
  }
});

function getCandidate(html) {
        var json = {};
        json.name = $(html).find('.nameCont').find('.bkt4').text();

        var experience, current_ctc, location, preferred_location = "";
        if ($(html).find(".exp-sal-loc-box span:nth-child(1)")[0]) {
            experience = $(html).find(".exp-sal-loc-box span:nth-child(1)")[0].innerText;
        }
        if ($(html).find(".exp-sal-loc-box span:nth-child(2)")[0]) {
            current_ctc = $(html).find(".exp-sal-loc-box span:nth-child(2)")[0].innerText;
        }
        if ($(html).find(".exp-sal-loc-box span:nth-child(3)")[0]) {
            location = $(html).find(".exp-sal-loc-box span:nth-child(3)")[0].innerText;
        }
        if ($(html).find(".exp-sal-loc-box span:nth-child(4)")[0]) {
            preferred_location = $(html).find(".exp-sal-loc-box span:nth-child(4)")[0].innerText;
        }
        json.experience = experience;
        json.current_ctc = current_ctc;
        json.location = location;
        json.preferred_location = preferred_location;

        json.current_role = $(html).find("label:contains('Current')").next().first().text();
        json.previous_role = $(html).find("label:contains('Previous')").next().first().text();
        json.highest_degree = $(html).find("label:contains('Highest Degree')").next().first().text();
        json.notice_period = $(html).find("label:contains('Notice Period')").next().first().text();
        json.key_skills = $(html).find('.right-container').find('div').first().next().text()
                          .substring(0, $(html).find('.right-container').find('div').first().next().text().indexOf(' IT Skills Details'));
        json.may_also_know = $(html).find('.cl').text();
        json.phone_no = $(html).find('.num').first().text();
        json.email_id = $(html).find('.emailCont').first().text().replace(/\s\s+/g, '');

        var work_summary = {};
        work_summary.description = $(html).find('.content > .bkt4').first().text();
        work_summary.industry = $(html).find("label:contains('Industry')").next().first().text();
        work_summary.functional_area = $(html).find("label:contains('Functional Area')").next().first().text();
        work_summary.role = $(html).find("label:contains('Role')").next().first().text();
        json.work_summary = work_summary;

        var work_experience = [];
        $(html).find('.exp-container').map(function(index,item) {
          var experienceItem = {};
          experienceItem.role = $(item).find('.designation').text();
          experienceItem.organization = $(item).find('.org').text();
          experienceItem.skills = $(item).find('.details').text();
          experienceItem.duration = $(item).find('.time').text().replace(experienceItem.role, '');
          work_experience.push(experienceItem);
        });
        json.work_experience = work_experience;
        
        var education = [];
        $(html).find('.education-inner').map(function(index,item) {
          var educationItem = {};
          educationItem.type = $(item).find('.title').text();
          educationItem.course = $(item).find('.detail').find('.deg').text();
          educationItem.passout = $(item).find('.detail').text().replace(educationItem.course, '').replace(/\s\s+/g, '');
          educationItem.institution = $(item).find('.org').text();
          education.push(educationItem);
        });
        json.education = education;

        var it_skills = [];
        var skillNames = [];
        var versions = [];
        var lastUsedItems = []; 
        var experiences = [];
        $(html).find('#it-skills-table tbody tr td:nth-child(1)').each( function(){
            skillNames.push( $(this).text() );       
        });
        $(html).find('#it-skills-table tbody tr td:nth-child(2)').each( function(){
            versions.push( $(this).text() );       
        });
        $(html).find('#it-skills-table tbody tr td:nth-child(3)').each( function(){
            lastUsedItems.push( $(this).text() );       
        });
        $(html).find('#it-skills-table tbody tr td:nth-child(4)').each( function(){
            experiences.push( $(this).text() );       
        });
        var i;
        for (i = 0; i < skillNames.length; i++) { 
            var itSkillItem = {};
            itSkillItem.skill_name = skillNames[i];
            itSkillItem.version = versions[i];
            itSkillItem.last_used = lastUsedItems[i];
            itSkillItem.experience = experiences[i];
            it_skills.push(itSkillItem);
        }
        json.it_skills = it_skills;

        var other_details = {};

        var languages_known = [];
        $(html).find('.lang-container').find('tbody').map(function(index,item) {
            $(item).find('tr').map(function(i, itm) {
              if (i > 0) {
                languages_known.push($(itm)[0].innerText.replace(/\s\s+/g, '').replace(' ', ''));
              }
            })
        })
        other_details.languages_known = languages_known;

        var personal_details = {};
        personal_details.date_of_birth = $(html).find("label:contains('Date of Birth:')").next().first().text();
        personal_details.gender = $(html).find("label:contains('Gender:')").next().first().text();
        personal_details.marrital_status = $(html).find("label:contains('Marital Status:')").next().first().text();
        personal_details.category = $(html).find("label:contains('Category:')").next().first().text();
        personal_details.physically_challenged = $(html).find("label:contains('Physically Challenged:')").next().first().text();
        personal_details.address = $(html).find(".address-box div:nth-child(2)").text();
        personal_details.contact = json.email_id;
        personal_details.email = json.phone_no;
        other_details.personal_details = personal_details;

        var desired_job_details = {};
        desired_job_details.job_type = $(html).find("label:contains('Job Type:')").next().first().text();
        desired_job_details.employment_status = $(html).find("label:contains('Employment Status:')").next().first().text();
        other_details.desired_job_details = desired_job_details;

        var work_authorization = {};
        work_authorization.us_work_status = $(html).find("label:contains('US Work Status:')").next().first().text();
        work_authorization.other_country_status = $(html).find("label:contains('Other Countries Status:')").next().first().text();
        other_details.work_authorization = work_authorization;

        json.other_details = other_details;
    
        return json;
}

function onWindowLoad() {
  //Execute the script to fetch the HTML source
  chrome.tabs.executeScript(null, {
    file: "getPagesSource.js"
  }, function() {
    // If you try and inject into an extensions page or the webstore/NTP you'll get an error
    if (chrome.runtime.lastError) {
      console.log('There was an error injecting script : \n' + chrome.runtime.lastError.message);
    }
  });
}
window.onload = onWindowLoad;