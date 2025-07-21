-- Insert cybersecurity tags first
INSERT INTO tags (name, color) VALUES 
  ('External Pentest', '#ef4444'),
  ('Internal Pentest', '#f97316'),
  ('Phishing', '#eab308'),
  ('Domain Admin', '#22c55e'),
  ('OT', '#06b6d4'),
  ('Wireless', '#8b5cf6'),
  ('Web App', '#ec4899'),
  ('PII data', '#f59e0b'),
  ('PHI data', '#10b981'),
  ('Stolen Laptop', '#6366f1')
ON CONFLICT (name) DO NOTHING;

-- Insert realistic pentesting stories for demo
INSERT INTO stories (title, content, author_id, business_vertical) VALUES 
  (
    'Critical SQL Injection Found in Patient Portal',
    'During our external penetration test of the healthcare provider''s patient portal, we discovered a critical SQL injection vulnerability in the appointment booking system. The vulnerability allowed us to extract sensitive patient health information including medical records, insurance details, and personal identifiers.

**Impact:** Complete database compromise affecting 50,000+ patient records
**CVSS Score:** 9.8 (Critical)
**Remediation:** Implemented parameterized queries and input validation

The vulnerability was found in the appointment search functionality where user input was directly concatenated into SQL queries without proper sanitization. We were able to demonstrate full database extraction within 2 hours of testing.',
    (SELECT user_id FROM profiles LIMIT 1),
    'Healthcare'
  ),
  (
    'Domain Admin Compromise via Phishing Campaign',
    'Our red team exercise successfully compromised domain administrator credentials through a targeted phishing campaign against the IT department. The attack chain involved:

1. **Initial Access:** Spear-phishing email to IT staff
2. **Credential Harvesting:** Fake Office 365 login page
3. **Lateral Movement:** Used harvested credentials to access domain controller
4. **Persistence:** Created backdoor admin account

**Timeline:** Domain admin access achieved within 4 hours
**Affected Systems:** 500+ workstations, 50+ servers
**Business Impact:** Complete network compromise

The campaign highlighted the need for enhanced security awareness training and multi-factor authentication implementation across all privileged accounts.',
    (SELECT user_id FROM profiles LIMIT 1),
    'Financial Services'
  ),
  (
    'Wireless Network Infiltration at Manufacturing Plant',
    'Internal penetration testing revealed multiple wireless security vulnerabilities at the manufacturing facility. We successfully gained unauthorized access to the production network through:

**Vulnerabilities Identified:**
- WPA2 with weak PSK on guest network
- Unencrypted management interfaces
- Default credentials on wireless access points
- Insufficient network segmentation

**Attack Vector:** Evil twin attack + credential harvesting
**Systems Compromised:** SCADA systems, inventory management, production line controls

The breach could have resulted in production shutdown and safety incidents. Immediate remediation included network segregation and wireless security hardening.',
    (SELECT user_id FROM profiles LIMIT 1),
    'Manufacturing'
  ),
  (
    'Government Database Breach via Web Application',
    'External penetration test of the city government''s public services portal revealed multiple high-severity vulnerabilities leading to unauthorized access to citizen data.

**Key Findings:**
- Cross-Site Scripting (XSS) in permit application forms
- Insecure Direct Object References exposing citizen records
- Authentication bypass in document upload system
- Sensitive data exposure in error messages

**Data at Risk:** 
- Social Security Numbers
- Property tax records
- Business license information
- Permit applications

The web application lacked proper input validation and authorization controls, allowing attackers to access any citizen''s personal information by manipulating URL parameters.',
    (SELECT user_id FROM profiles LIMIT 1),
    'Government'
  ),
  (
    'Cloud Infrastructure Penetration - Fortune 500 Tech Company',
    'During our cloud security assessment, we identified critical misconfigurations in the organization''s AWS infrastructure leading to data exposure and potential service disruption.

**Critical Findings:**
- Public S3 buckets containing source code and API keys
- Overprivileged IAM roles with excessive permissions
- Unencrypted RDS instances with default passwords
- Security groups allowing unrestricted access

**Attack Simulation:**
Successfully accessed production databases and internal applications through exposed credentials found in public repositories.

**Impact:** Potential exposure of intellectual property, customer data, and internal systems affecting millions of users.',
    (SELECT user_id FROM profiles LIMIT 1),
    'Technology'
  ),
  (
    'Point-of-Sale System Compromise at Retail Chain',
    'Physical penetration test at retail locations revealed vulnerabilities in point-of-sale systems and payment processing infrastructure.

**Attack Vectors:**
- Physical access to unsecured POS terminals
- Network segmentation bypass
- Default credentials on payment processing servers
- Unencrypted card data transmission

**Demonstrated Impact:**
- Credit card data interception
- Transaction manipulation
- Customer PII exposure
- Potential for large-scale data breach

The assessment revealed that payment card data was being stored in violation of PCI DSS requirements, with encryption gaps and insufficient access controls.',
    (SELECT user_id FROM profiles LIMIT 1),
    'Retail'
  ),
  (
    'University Network Intrusion via Stolen Device',
    'Security assessment revealed how a stolen faculty laptop could compromise the entire university network and student information systems.

**Attack Scenario:**
- Faculty laptop theft from office
- Extracted cached credentials and VPN certificates
- Gained access to student information system
- Accessed financial aid records and grade databases

**Data Exposed:**
- 25,000+ student records
- Financial aid information
- Academic transcripts
- Research data

The incident highlighted inadequate endpoint security policies and the need for device encryption and remote wipe capabilities.',
    (SELECT user_id FROM profiles LIMIT 1),
    'Education'
  ),
  (
    'SCADA System Penetration at Power Utility',
    'Critical infrastructure assessment revealed vulnerabilities in operational technology systems that could impact power grid stability.

**OT Security Findings:**
- Unpatched HMI systems with remote access
- Default passwords on PLCs and RTUs
- Insufficient network segmentation between IT/OT
- Lack of monitoring on industrial networks

**Potential Impact:**
- Power grid manipulation
- Equipment damage
- Service disruption affecting 100,000+ customers
- Safety system bypass

The assessment demonstrated how attackers could gain control of power generation and distribution systems through vulnerable OT networks.',
    (SELECT user_id FROM profiles LIMIT 1),
    'Energy & Utilities'
  ),
  (
    'Insurance Claims System Data Breach',
    'Web application penetration testing of the insurance company''s claims processing system revealed multiple vulnerabilities exposing sensitive customer data.

**Vulnerabilities:**
- SQL injection in claims search functionality
- Broken authentication allowing account takeover
- Sensitive data exposure in API responses
- Insufficient authorization controls

**Protected Data at Risk:**
- Policy holder information
- Medical records and health data
- Financial information
- Claims documentation

The breach could result in HIPAA violations and significant regulatory penalties. Immediate patching and security controls implementation was required.',
    (SELECT user_id FROM profiles LIMIT 1),
    'Insurance'
  ),
  (
    'Transportation Management System Compromise',
    'Internal penetration test revealed critical vulnerabilities in the logistics company''s transportation management system affecting fleet operations.

**Key Findings:**
- GPS tracking system manipulation
- Fleet management database access
- Driver personal information exposure
- Route optimization system compromise

**Business Impact:**
- Delivery disruption
- Customer data exposure
- Competitive intelligence theft
- Safety concerns for drivers

The assessment showed how attackers could track vehicle locations, access driver information, and potentially cause safety incidents through system manipulation.',
    (SELECT user_id FROM profiles LIMIT 1),
    'Transportation'
  );

-- Create story-tag relationships
WITH story_tag_mappings AS (
  SELECT 
    s.id as story_id,
    t.id as tag_id
  FROM stories s
  CROSS JOIN tags t
  WHERE 
    (s.title LIKE '%SQL Injection%' AND t.name IN ('External Pentest', 'Web App', 'PHI data')) OR
    (s.title LIKE '%Domain Admin%' AND t.name IN ('Internal Pentest', 'Phishing', 'Domain Admin')) OR
    (s.title LIKE '%Wireless%' AND t.name IN ('Internal Pentest', 'Wireless', 'OT')) OR
    (s.title LIKE '%Government Database%' AND t.name IN ('External Pentest', 'Web App', 'PII data')) OR
    (s.title LIKE '%Cloud Infrastructure%' AND t.name IN ('External Pentest', 'Web App')) OR
    (s.title LIKE '%Point-of-Sale%' AND t.name IN ('Internal Pentest', 'PII data')) OR
    (s.title LIKE '%Stolen Device%' AND t.name IN ('Stolen Laptop', 'Internal Pentest', 'PII data')) OR
    (s.title LIKE '%SCADA%' AND t.name IN ('Internal Pentest', 'OT')) OR
    (s.title LIKE '%Insurance Claims%' AND t.name IN ('External Pentest', 'Web App', 'PHI data', 'PII data')) OR
    (s.title LIKE '%Transportation%' AND t.name IN ('Internal Pentest', 'PII data'))
)
INSERT INTO story_tags (story_id, tag_id)
SELECT story_id, tag_id FROM story_tag_mappings;