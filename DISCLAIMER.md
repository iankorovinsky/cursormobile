# ⚖️ Legal Disclaimer & Terms of Use

**PLEASE READ CAREFULLY BEFORE USING THIS SOFTWARE**

## Overview

**Cursor on the Go!** is a hackathon project created for HackUTD 2025 as a proof-of-concept and educational demonstration. This software was NOT designed, tested, or audited for production use, security, or safety.

**BY USING THIS SOFTWARE, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO ALL TERMS IN THIS DISCLAIMER.**

---

## No Warranty

THIS SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT.

The authors, contributors, and maintainers make no representations or warranties of any kind concerning the safety, suitability, lack of viruses, inaccuracies, typographical errors, or other harmful components of this software. There are inherent dangers in the use of any software, and you are solely responsible for determining whether this software is compatible with your equipment and other software installed on your equipment.

---

## Use at Your Own Risk

### You Acknowledge and Agree That:

1. **Sole Risk**: You use this software entirely at your own risk. The authors, contributors, and maintainers of this project bear no responsibility for any damages, data loss, security breaches, or other consequences that may result from using this software.

2. **Hackathon Project**: This is a hackathon project built for educational and demonstration purposes only. It was developed quickly (within 24-48 hours) and has not been designed, tested, or audited for production use or security.

3. **Security Vulnerabilities**: This software LIKELY CONTAINS SECURITY VULNERABILITIES. It has not undergone professional security auditing, penetration testing, or code review. Do not use it in any security-sensitive context or environment.

4. **Remote Code Execution Risk**: This application allows remote execution of commands and code through Cursor's AI assistant. If you expose the relay server to the public internet (via port forwarding, ngrok, or similar tools), **anyone who can access your server can potentially execute arbitrary code on your computer.**

5. **No Authentication**: By default, this application has NO authentication, authorization, or access controls. Any person or bot that can reach your relay server endpoint can send commands and prompts.

6. **Data Privacy**: All messages are transmitted in plain text over WebSocket connections without encryption (unless you explicitly add TLS/SSL). Do not use this software with sensitive, confidential, proprietary, or personal information.

7. **System Damage**: The AI can execute terminal commands, install software packages, modify files, delete data, change system settings, and perform other potentially destructive operations. There are NO safeguards, sandboxing, or restrictions preventing dangerous or destructive operations.

8. **Network Exposure**: When you bind services to `0.0.0.0` or use tunneling services like ngrok, you are exposing your system to the network and/or internet. This creates significant security risks including unauthorized access, data theft, malware installation, and system compromise.

9. **AI Behavior**: AI assistants can make mistakes, misunderstand instructions, or take unexpected actions. The AI has full access to your terminal and filesystem through Cursor. There is no mechanism to undo or rollback changes made by the AI.

10. **Third-Party Services**: This software relies on third-party services including Cursor IDE, OpenAI/Anthropic APIs (via Cursor), Auth0, Stripe, and others. The authors have no control over these services and are not responsible for their actions, availability, or security.

---

## Limitation of Liability

### No Liability

IN NO EVENT SHALL THE AUTHORS, COPYRIGHT HOLDERS, CONTRIBUTORS, OR MAINTAINERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING FROM, OUT OF, OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

### Specific Exclusions

This limitation of liability includes but is not limited to:

- **Direct Damages**: Any direct damages including but not limited to financial loss, data loss, system damage, or physical harm
- **Indirect Damages**: Any indirect, incidental, special, exemplary, or consequential damages
- **Loss of Data**: Loss, corruption, or unauthorized access to data, files, configurations, or systems
- **Loss of Profits**: Loss of business opportunities, revenue, profits, or goodwill
- **Security Breaches**: Unauthorized access to your systems, networks, or data by third parties
- **System Damage**: Damage to computer systems, networks, hardware, or software
- **Malware**: Installation of malware, viruses, trojans, ransomware, or other malicious software
- **Legal Consequences**: Any legal liability arising from your use of this software
- **Third-Party Actions**: Actions taken by third parties who gain access to your systems through this software
- **AI-Generated Actions**: Any actions taken by AI assistants including code execution, file modifications, or system changes
- **Any Other Losses**: Any other losses or damages of any kind, whether foreseeable or unforeseeable

### Maximum Liability

In jurisdictions where limitation of liability is not permitted, the authors' maximum aggregate liability shall not exceed the amount you paid for this software (which is $0, as this is free open-source software).

---

## Your Responsibilities

By using this software, you agree that you are solely responsible for:

1. **Understanding the Risks**: Fully understanding the security risks and technical implications of running this software
2. **System Security**: Securing your systems, networks, and data
3. **Monitoring**: Monitoring all activity and logging all operations
4. **Backups**: Creating and maintaining backups of all important data before use
5. **Isolation**: Running this software only on isolated test machines or virtual machines
6. **Network Security**: Properly configuring firewalls, network access controls, and authentication
7. **Compliance**: Complying with all applicable laws, regulations, and organizational policies
8. **Consequences**: Accepting full responsibility for any and all consequences of using this software
9. **Due Diligence**: Performing your own security assessment and risk evaluation
10. **Testing**: Testing in a safe environment before any potential production use (though production use is explicitly discouraged)

---

## Acknowledgment and Acceptance

By downloading, installing, running, or using this software in any way, you acknowledge and agree that:

- ✅ You have read and understood this entire disclaimer
- ✅ You accept ALL risks associated with using this software
- ✅ You will NOT hold the authors, contributors, or maintainers liable for ANY consequences
- ✅ You understand this is experimental hackathon software, NOT production-ready code
- ✅ You are SOLELY RESPONSIBLE for any and all consequences that result from your use
- ✅ You will use this software ONLY in accordance with the safe usage guidelines
- ✅ You understand that the AI can execute arbitrary code on your system
- ✅ You will NOT use this software with sensitive, important, or production data
- ✅ You will NOT expose this software to untrusted networks or the public internet
- ✅ You have the technical expertise to understand and manage the risks

**IF YOU DO NOT AGREE TO THESE TERMS, DO NOT USE THIS SOFTWARE.**

---

## Recommendations for Safer Use

If you choose to use this software despite the significant risks, we strongly recommend:

### Environment

- ✅ **Use Virtual Machines**: Run this only in disposable virtual machines that can be easily wiped/restored
- ✅ **Isolated Networks**: Use on isolated networks with no connection to production systems
- ✅ **Test Machines**: Use dedicated test machines with no important data
- ✅ **Snapshots**: Take VM snapshots before each use so you can rollback changes

### Security

- ✅ **No Production Use**: Never use this on production machines, networks, or with production data
- ✅ **Local Only**: Keep the relay server bound to localhost (`127.0.0.1`) whenever possible
- ✅ **Trusted Networks**: If you must expose it, use only on trusted private networks (never public internet)
- ✅ **Firewall Rules**: Configure strict firewall rules allowing only specific trusted IP addresses
- ✅ **Authentication**: Add authentication/authorization if you must expose the server (not included by default)
- ✅ **Monitoring**: Monitor all connections and log all activity
- ✅ **Short Sessions**: Run only when actively needed, shut down immediately after use

### Data

- ✅ **No Sensitive Data**: Never use with sensitive, confidential, proprietary, or personal data
- ✅ **Backups**: Maintain backups of anything important (though nothing important should be on the test system)
- ✅ **Separate Systems**: Keep completely separate from any systems containing important data

### Supervision

- ✅ **Active Supervision**: Actively monitor and supervise all AI-generated actions
- ✅ **Review Commands**: Review any commands or code before allowing execution when possible
- ✅ **Kill Switch**: Be prepared to immediately terminate the application if needed
- ✅ **No Unattended Use**: Never leave this running unattended

### Recovery

- ✅ **Wipe Plan**: Have a plan to wipe/restore the machine if something goes wrong
- ✅ **Incident Response**: Know how to respond if the system is compromised
- ✅ **Contact Info**: Have contact information for security teams if in an organizational context

---

## Specific Warnings

### Remote Code Execution

This application essentially provides remote code execution capabilities. Anyone who can send prompts to your Cursor instance can:
- Execute shell commands on your system
- Install software packages
- Modify, create, or delete files
- Change system configurations
- Access sensitive data on your filesystem
- Use your system as a pivot point to attack other systems

**This is extremely dangerous if exposed to untrusted parties.**

### Network Exposure

When you:
- Bind to `0.0.0.0` instead of `localhost`
- Use ngrok or similar tunneling services
- Forward ports through your router
- Disable firewalls

You are potentially allowing anyone on the internet to access your relay server and, by extension, execute code on your computer.

### AI Unpredictability

AI assistants:
- Can misunderstand instructions
- May take unexpected actions
- Can make mistakes with serious consequences
- Have no built-in safety mechanisms in this implementation
- Cannot be fully controlled or predicted

---

## Educational Purpose

This project was created for **HackUTD 2025** as:
- A proof-of-concept demonstration
- A learning exercise in system integration and real-time communication
- An exploration of interesting technical challenges
- A fun hackathon project

**It is NOT intended for:**
- Production use
- Commercial applications
- Security-sensitive environments
- Use with real/important data
- Long-term deployment
- Public exposure

---

## No Support or Maintenance

This is a hackathon project. There is:
- No guarantee of support or maintenance
- No commitment to fix bugs or security issues
- No promise of updates or improvements
- No warranty of fitness for any purpose
- No obligation to assist with problems

You are entirely on your own if you choose to use this software.

---

## Governing Law

This disclaimer shall be governed by and construed in accordance with the laws of the jurisdiction where the HackUTD hackathon took place (Texas, United States), without regard to its conflict of law provisions.

---

## Changes to This Disclaimer

The authors reserve the right to modify this disclaimer at any time without notice. It is your responsibility to review this disclaimer periodically. Your continued use of the software after changes constitutes acceptance of the modified disclaimer.

---

## Final Warning

**⚠️ USE THIS SOFTWARE AT YOUR OWN RISK. YOU HAVE BEEN WARNED. ⚠️**

This disclaimer is not meant to scare you away from learning and experimentation. However, it is crucial that you understand the real and serious risks involved with this type of software. We encourage responsible experimentation in safe, isolated environments.

**If you are not comfortable with these risks or do not fully understand them, DO NOT USE THIS SOFTWARE.**

---

*Last Updated: November 2025*
