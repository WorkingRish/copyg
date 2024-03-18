"use strict";
import Swal from 'sweetalert2';

// loader-code: wait until gmailjs has finished loading, before triggering actual extensiode-code.
const loaderId = setInterval(() => {
    if (!window._gmailjs) {
        return;
    }

    clearInterval(loaderId);
    safeSend(window._gmailjs);
}, 100);

// actual extension-code
function safeSend(gmail) {
    console.log("Extension loading...");
    window.gmail = gmail;

    //whitelisted domains, excluded from the safe send
    let osttraDoms = ['osttra.com', 'trioptima.com', 'ihsmarkit.com', 'traiana.com', 'reset.net', 'spglobal.com', 'markit.com', 'markitserv.com']



        gmail.observe.on("compose", (compose) => {
            console.log("New compose window is opened!", compose);
            let sendButton = compose.find("div[role=button]:contains('Send')");



            if (sendButton.length > 0) {

                var overlay = document.createElement('div');
                overlay.style.position = 'absolute';
                overlay.style.top = sendButton.offset().top + 'px'; // Position overlay over the send button
                overlay.style.left = sendButton.offset().left + 'px';
                overlay.style.width = sendButton.outerWidth() + 'px';
                overlay.style.height = sendButton.outerHeight() + 'px';
                overlay.style.zIndex = 1000; // Ensure overlay is above the send button
                overlay.style.cursor = 'pointer';
                overlay.style.backgroundColor = (0,0,0,0.5)//'transparent'; // Semi-transparent overlay
    
                // Append the overlay to the body
                document.body.appendChild(overlay);
    
                // Add click event listener to the overlay
                overlay.addEventListener('click', function(event) {
                    event.stopPropagation(); // Prevent click from reaching the send button
                    console.log('Overlay clicked. Intercepting send button functionality.');

                    function recHelper(recipients, arr) {
                        recipients.forEach(rec => {
                            let domain = rec.split("@")[1].toLowerCase();
                            console.log(domain);
                            if (!osttraDoms.includes(domain)) {
                                arr.push(rec);
                            }
                        });

                    }

                    function processRec(){
                        let recipients = compose.recipients()
                        let toRec = recipients.to
                        let ccRec = recipients.cc
                        let bccRec = recipients.bcc
                        let message = 'You are about to send an email to:'
                        let recArr = []
                        let ccArr = []
                        let bccArr = []
                        let attachArr = compose.attachments()
                        let keys = Object.keys(attachArr)
                        let namArr = []


                        for (let i = 0; i < keys.length; i++){
                            // namArr.push(attachArr[i].name)
                            let fileName = attachArr[i].name;
    
                             // Check if the file name ends with any of the specified extensions
                             if (fileName.endsWith('.csv') || fileName.endsWith('.xls') || 
                            fileName.endsWith('.xlsx') || fileName.endsWith('.zip')) {
                             namArr.push(fileName); // Push the name to namArr if it matches the extensions
    }
                        }
                        console.log(namArr)



                        recHelper(toRec,recArr)
                        recHelper(ccRec,ccArr)
                        recHelper(bccRec,bccArr)

                        console.log(recArr,ccArr,bccArr)
                        if (recArr.length || ccArr.length || bccArr.length) {
                            console.log('external detected! Not Send!')


                            ///--------------------------------------Group emails-------------------------------
                            function groupEmailsByEmailDomain(emails) {
                                let groupedEmails = {};
                                emails.forEach(email => {
                                    let domain = email.split('@')[1];
                                    if (!groupedEmails[domain]) {
                                        groupedEmails[domain] = [];
                                    }
                                    groupedEmails[domain].push(email);
                                });
                                    // Create an array of the domain keys and sort it
                                    const sortedDomains = Object.keys(groupedEmails).sort();

                                    // Build a new sorted object of grouped emails
                                    let sortedGroupedEmails = {};
                                    sortedDomains.forEach(domain => {
                                        sortedGroupedEmails[domain] = groupedEmails[domain];
                                    });

                                    return sortedGroupedEmails;
                            }


                            ///--------------------------------------------Adding the pop up box -----------------------------------
                            function showAlertWithCheckboxes(message, recArr, ccArr, bccArr, namArr) {
                                const allRecipients = [...recArr, ...ccArr, ...bccArr];
                                const allNames = [...namArr];
                              
                                const colors = [
                                    "#FF6B6B", "#6BCB77", "#4D96FF", "#9D65C9", 
                                    "#FF9671", "#FFC75F", "#32AFA9", "#0081CF", "#C34A36", 
                                    "#845EC2", "#D65DB1", "#008F7A", "#0089BA", 
                                    "#B39CD0", "#FF8066"
                                ];
                            
                                let checkboxesHTML = '<div style="text-align: left;">';
                            
                                // if (allRecipients.length > 10) {
                                //     const emailsByDomain = groupEmailsByEmailDomain(allRecipients);
                                //     const domainKeys = Object.keys(emailsByDomain);
                            
                                //     domainKeys.forEach((domain, index) => {
                                //         const color = colors[index % colors.length]; // Cycle through colors if more domains than colors
                            
                                //         checkboxesHTML += `<div style="color: ${color};"><strong>${domain}</strong><br>`;
                                //         emailsByDomain[domain].forEach(email => {
                                //             checkboxesHTML += `
                                //                 <input type="checkbox" id="${email}" class="swal2-checkbox-input">
                                //                 <label for="${email}">${email}</label><br>
                                //             `;
                                //         });
                                //         checkboxesHTML += '</div><br>'; // Close the domain section
                                //     });
                                if (allRecipients.length > 1) {
                                    const emailsByDomain = groupEmailsByEmailDomain(allRecipients);
                                    const domainKeys = Object.keys(emailsByDomain);
                            
                                    // Add a "Select All" checkbox
                                    checkboxesHTML += `
                                        <input type="checkbox" id="selectAll" class="swal2-checkbox-input">
                                        <label for="selectAll"><strong>Select All</strong></label><br><br>
                                    `;
                            
                                    domainKeys.forEach((domain, index) => {
                                        const color = colors[index % colors.length]; // Cycle through colors if more domains than colors
                            
                                        checkboxesHTML += `<div style="color: ${color};"><strong>${domain}</strong><br>`;
                                        emailsByDomain[domain].forEach(email => {
                                            checkboxesHTML += `
                                                <input type="checkbox" id="${email}" class="swal2-checkbox-input">
                                                <label for="${email}">${email}</label><br>
                                            `;
                                        });
                                        checkboxesHTML += '</div><br>'; // Close the domain section
                                    });
                                } else {
                                // Original functionality for 10 or fewer recipients
                                checkboxesHTML += allRecipients.map(email => `
                                    <input type="checkbox" id="${email}" class="swal2-checkbox-input">
                                    <label for="${email}">${email}</label><br>
                                `).join('');
                                }
 
                                 if (namArr.length){
                                     checkboxesHTML += '<br><div>With the attachments:</div>';
                                 }
                                 checkboxesHTML+= allNames.map(name => `
                                   <input type="checkbox" id="${name}" class="swal2-checkbox-input">
                                   <label for="${name}">${name}</label><br>
                                 `).join('');
                                 checkboxesHTML += '</div>'; // Close the div
 
                               
                                 Swal.fire({
                                   title: 'Confirm Send',
                                   html: message + "<br><br>" + checkboxesHTML,
                                   icon: 'warning',
                                   showCancelButton: true,
                                   confirmButtonText: 'Yes, send it!',
                                   cancelButtonText: 'No, cancel!',
                                   preConfirm: () => {
                                     // Check if all checkboxes are checked
                                     const allChecked = [...document.querySelectorAll('.swal2-checkbox-input')].every(checkbox => checkbox.checked);
                                     if (!allChecked) {
                                       Swal.showValidationMessage('You need to check all boxes before sending!');
                                     }
                                   },  didOpen: () => {
                                    const selectAllCheckbox = document.getElementById('selectAll');
                                    if (selectAllCheckbox) {
                                        selectAllCheckbox.addEventListener('change', function(e) {
                                            const checked = e.target.checked;
                                            document.querySelectorAll('.swal2-checkbox-input').forEach(checkbox => {
                                                checkbox.checked = checked;
                                            });
                                        });
                                    }
                                }
                                 }).then((result) => {
                                   if (result.isConfirmed) {
                                       console.log('Person pressed Yes');
                                       compose.send()
                                   }
                                 })
                               }
                            
                            showAlertWithCheckboxes(message, recArr, ccArr, bccArr, namArr)




                            //////////////////////////////--------Endo of the popup box --------------------------------------------------

                        } else{
                            compose.send()
                            console.log('no external detected')
                        }



                    }

                    processRec()

                });
    
            }

            function updateOverlay(){
                overlay.style.top = sendButton.offset().top + 'px'; // Position overlay over the send button
                overlay.style.left = sendButton.offset().left + 'px';
                overlay.style.width = sendButton.outerWidth() + 'px';
                overlay.style.height = sendButton.outerHeight() + 'px';
            }


            let intVals = setInterval(function() {   
                updateOverlay()     
                // console.log(compose)
            }, 1000)
        
        


        });
   
}
