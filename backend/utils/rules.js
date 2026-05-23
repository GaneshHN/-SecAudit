/**
 * Comprehensive multi-language security rules.
 * Covers: JS/TS, Python, Java, C/C++, C#, Go, Ruby, PHP, Shell, Docker, Terraform, YAML, SQL, HTML
 */

const securityRules = [
  // ═══════════════════════════════════════════════════════════════
  // HIGH — Secrets & Credentials (all languages)
  // ═══════════════════════════════════════════════════════════════
  {
    name: "Hardcoded API Key",
    regex: /(?:api[_-]?key|apikey|api_secret)\s*[:=]\s*['"`]([A-Za-z0-9_\-/.]{12,})['"`]/gi,
    severity: "High", category: "Secret Leak", owasp: "A02:2021 - Cryptographic Failures",
    description: "API key is hardcoded in source code. Attackers can extract and abuse the key if the repo is public.",
    fix: "Store API keys in environment variables or a secrets manager. Never commit secrets to version control.",
  },
  {
    name: "Hardcoded Secret/Token",
    regex: /(?:secret|token|auth[_-]?token|access[_-]?token|bearer|session[_-]?secret|jwt[_-]?secret|signing[_-]?key)\s*[:=]\s*['"`]([A-Za-z0-9_\-/.+]{12,})['"`]/gi,
    severity: "High", category: "Secret Leak", owasp: "A02:2021 - Cryptographic Failures",
    description: "A secret or authentication token is hardcoded. Attackers who access the source code can impersonate users or systems.",
    fix: "Move secrets to environment variables or a secrets manager (AWS Secrets Manager, Vault). Rotate exposed secrets immediately.",
  },
  {
    name: "Hardcoded Password",
    regex: /(?:password|passwd|pwd|pass)\s*[:=]\s*['"`]([^'"`\s]{4,})['"`]/gi,
    severity: "High", category: "Secret Leak", owasp: "A07:2021 - Identification Failures",
    description: "Password embedded directly in code. Critical risk if the repository is public or shared.",
    fix: "Use environment variables for credentials. Implement a secrets manager for production.",
  },
  {
    name: "Private Key Detected",
    regex: /-----BEGIN\s+(?:RSA|EC|DSA|OPENSSH|PGP|PRIVATE)?\s*PRIVATE KEY-----/gi,
    severity: "High", category: "Secret Leak", owasp: "A02:2021 - Cryptographic Failures",
    description: "A private key is committed to the codebase. It can impersonate servers, decrypt data, or sign malicious artifacts.",
    fix: "Remove the key immediately. Rotate it. Store keys outside the repo using a secrets manager.",
  },
  {
    name: "AWS Access Key",
    regex: /AKIA[0-9A-Z]{16}/g,
    severity: "High", category: "Secret Leak", owasp: "A02:2021 - Cryptographic Failures",
    description: "AWS Access Key ID detected. If paired with a secret key, it grants access to your AWS account.",
    fix: "Revoke and rotate in AWS IAM. Use IAM roles or environment variables instead.",
  },
  {
    name: "Google/GCP API Key",
    regex: /AIza[0-9A-Za-z_-]{35}/g,
    severity: "High", category: "Secret Leak", owasp: "A02:2021 - Cryptographic Failures",
    description: "Google Cloud or Firebase API key detected. Can be abused to access GCP resources or incur costs.",
    fix: "Restrict the key in Google Cloud Console. Use environment variables.",
  },
  {
    name: "Database Connection String",
    regex: /(?:mongodb(?:\+srv)?|postgres(?:ql)?|mysql|redis|mssql|jdbc:[a-z]+):\/\/[^\s'"`]{8,}/gi,
    severity: "High", category: "Secret Leak", owasp: "A02:2021 - Cryptographic Failures",
    description: "Database connection string with credentials hardcoded. Attackers can directly access your database.",
    fix: "Move database URLs to environment variables. Restrict database network access.",
  },
  {
    name: "Stripe/Payment Key",
    regex: /(?:sk_live|pk_live|sk_test|rk_live)_[A-Za-z0-9]{10,}/g,
    severity: "High", category: "Secret Leak", owasp: "A02:2021 - Cryptographic Failures",
    description: "Stripe payment key found. Live keys can process unauthorized transactions.",
    fix: "Remove and rotate in Stripe dashboard. Use environment variables.",
  },
  {
    name: "Generic Secret Pattern",
    regex: /(?:SECRET|PRIVATE|CREDENTIAL|AUTH)[_-]?(?:KEY|TOKEN|PASS)\s*[:=]\s*['"`]([A-Za-z0-9_\-/.+]{8,})['"`]/gi,
    severity: "High", category: "Secret Leak", owasp: "A02:2021 - Cryptographic Failures",
    description: "A generic secret or credential pattern detected in source code.",
    fix: "Move all secrets to environment variables. Use .env locally, inject via CI/CD in production.",
  },

  // ═══════════════════════════════════════════════════════════════
  // HIGH — Injection & RCE (multi-language)
  // ═══════════════════════════════════════════════════════════════
  {
    name: "SQL Injection (String Concat)",
    regex: /(?:SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\s+.*(?:\+\s*\w+|\$\{)/gi,
    severity: "High", category: "Injection", owasp: "A03:2021 - Injection",
    description: "SQL query built with string concatenation or interpolation. Vulnerable to SQL injection attacks.",
    fix: "Use parameterized queries or prepared statements. Use an ORM (Prisma, Sequelize, SQLAlchemy, Hibernate).",
  },
  {
    name: "Python os.system / subprocess Shell",
    regex: /(?:os\.system|os\.popen|subprocess\.call|subprocess\.run|subprocess\.Popen)\s*\(.*(?:f['"`]|\.format|%s|\+\s*\w+)/gi,
    severity: "High", category: "Injection", owasp: "A03:2021 - Injection",
    description: "Shell command uses dynamic input in Python. Can lead to command injection and remote code execution.",
    fix: "Use subprocess with shell=False and pass args as a list. Never interpolate user input into commands.",
  },
  {
    name: "PHP Command Injection",
    regex: /(?:shell_exec|system|passthru|popen|proc_open|pcntl_exec)\s*\(/gi,
    severity: "High", category: "Injection", owasp: "A03:2021 - Injection",
    description: "PHP shell execution function detected. If user input reaches these, it enables remote code execution.",
    fix: "Avoid shell functions. Use escapeshellarg() and escapeshellcmd() if absolutely needed. Validate all input.",
  },
  {
    name: "Python pickle / marshal (Deserialization)",
    regex: /pickle\.(?:loads?|Unpickler)|marshal\.loads?|yaml\.(?:load|unsafe_load)\s*\(/gi,
    severity: "High", category: "Injection", owasp: "A08:2021 - Data Integrity Failures",
    description: "Unsafe deserialization in Python. Pickle, marshal, and yaml.load can execute arbitrary code from untrusted data.",
    fix: "Use yaml.safe_load() instead of yaml.load(). Avoid pickle for untrusted data. Use JSON for serialization.",
  },
  {
    name: "Java Deserialization Risk",
    regex: /ObjectInputStream|readObject\s*\(|XMLDecoder|XStream\.fromXML/gi,
    severity: "High", category: "Injection", owasp: "A08:2021 - Data Integrity Failures",
    description: "Java deserialization of untrusted data can lead to remote code execution via gadget chains.",
    fix: "Avoid ObjectInputStream with untrusted data. Use look-ahead deserialization or JSON-based formats.",
  },

  // ═══════════════════════════════════════════════════════════════
  // MEDIUM — Code Quality & Security Patterns
  // ═══════════════════════════════════════════════════════════════
  {
    name: "eval() Usage",
    regex: /\beval\s*\(/g,
    severity: "Medium", category: "Code Quality", owasp: "A03:2021 - Injection",
    description: "eval() executes arbitrary code. Untrusted input passed to eval leads to Remote Code Execution.",
    fix: "Avoid eval(). Use JSON.parse() for data. In Python, use ast.literal_eval() for safe evaluation.",
  },
  {
    name: "dangerouslySetInnerHTML (XSS)",
    regex: /dangerouslySetInnerHTML\s*=\s*\{/g,
    severity: "Medium", category: "XSS", owasp: "A03:2021 - Injection",
    description: "dangerouslySetInnerHTML renders raw HTML in React. User input creates XSS vulnerabilities.",
    fix: "Use DOMPurify to sanitize HTML content, or use a safe markdown renderer instead.",
  },
  {
    name: "innerHTML Assignment",
    regex: /\.innerHTML\s*=|\.outerHTML\s*=/g,
    severity: "Medium", category: "XSS", owasp: "A03:2021 - Injection",
    description: "Direct innerHTML assignment can lead to XSS if user-controlled content is inserted.",
    fix: "Use textContent for text. Use DOMPurify for HTML. In frameworks, use built-in sanitization.",
  },
  {
    name: "Insecure HTTP URL",
    regex: /['"`]http:\/\/(?!localhost|127\.0\.0\.1|0\.0\.0\.0)[^'"`\s]+['"`]/gi,
    severity: "Medium", category: "Configuration", owasp: "A02:2021 - Cryptographic Failures",
    description: "HTTP URL found. Data transmitted over HTTP is unencrypted and vulnerable to interception.",
    fix: "Switch to HTTPS. Enforce TLS for all external communications.",
  },
  {
    name: "Disabled SSL/TLS Verification",
    regex: /rejectUnauthorized\s*:\s*false|NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['"`]?0|verify\s*=\s*False|ssl\s*:\s*false|InsecureSkipVerify\s*:\s*true|CURLOPT_SSL_VERIFYPEER\s*,\s*false/gi,
    severity: "Medium", category: "Configuration", owasp: "A02:2021 - Cryptographic Failures",
    description: "SSL/TLS verification is disabled, enabling man-in-the-middle attacks.",
    fix: "Enable SSL verification in production. Only disable for local dev with environment-based safeguards.",
  },
  {
    name: "Weak Cryptographic Algorithm",
    regex: /createHash\s*\(\s*['"`](?:md5|sha1)['"`]\)|hashlib\.(?:md5|sha1)\s*\(|MessageDigest\.getInstance\s*\(\s*['"`](?:MD5|SHA-1)['"`]\)|\bDES\.encrypt|\bRC4\.encrypt|Cipher\.getInstance\s*\(\s*['"`](?:DES|RC4|Blowfish)/gi,
    severity: "Medium", category: "Cryptography", owasp: "A02:2021 - Cryptographic Failures",
    description: "Weak/broken cryptographic algorithm (MD5, SHA-1, DES, RC4). Not safe for security operations.",
    fix: "Use SHA-256+. For passwords, use bcrypt/scrypt/argon2. For encryption, use AES-256-GCM.",
  },
  {
    name: "Sensitive Data in Logs",
    regex: /(?:console\.(?:log|info|warn|error)|print|println|logger?\.\w+|Log\.(?:d|i|w|e))\s*\(.*(?:password|secret|token|key|credential|authorization).*\)/gi,
    severity: "Medium", category: "Information Disclosure", owasp: "A09:2021 - Logging Failures",
    description: "Sensitive data may be logged. Log output appears in monitoring tools and consoles, exposing secrets.",
    fix: "Remove sensitive data from log statements. Use a structured logger with field redaction.",
  },
  {
    name: "Command Injection Risk (Node.js)",
    regex: /(?:exec|execSync|spawn|spawnSync|execFile)\s*\(\s*(?:.*\$\{|.*\+\s*\w+)/gi,
    severity: "Medium", category: "Injection", owasp: "A03:2021 - Injection",
    description: "Shell command uses string interpolation. Can lead to command injection if user input is included.",
    fix: "Pass arguments as arrays. Validate and sanitize all user input.",
  },
  {
    name: "C/C++ Buffer Overflow Risk",
    regex: /\b(?:gets|sprintf|strcpy|strcat|scanf)\s*\(/g,
    severity: "Medium", category: "Memory Safety", owasp: "A03:2021 - Injection",
    description: "Unsafe C/C++ function that doesn't check buffer bounds. Can lead to buffer overflow and code execution.",
    fix: "Use fgets(), snprintf(), strncpy(), strncat(), or C++ std::string instead.",
  },
  {
    name: "C/C++ Format String Vulnerability",
    regex: /printf\s*\(\s*(?!\s*['"`])[a-zA-Z_]\w*\s*\)/g,
    severity: "Medium", category: "Memory Safety", owasp: "A03:2021 - Injection",
    description: "printf() called with a variable as format string. Attacker-controlled format strings can read/write memory.",
    fix: "Always use a literal format string: printf(\"%s\", variable) instead of printf(variable).",
  },
  {
    name: "PHP SQL Injection",
    regex: /\$(?:_GET|_POST|_REQUEST|_COOKIE)\s*\[.*\]\s*(?:\.|\.=)/gi,
    severity: "Medium", category: "Injection", owasp: "A03:2021 - Injection",
    description: "PHP superglobal used directly in string concatenation. Common SQL injection vector.",
    fix: "Use prepared statements (PDO::prepare, mysqli_prepare). Never concatenate user input into queries.",
  },
  {
    name: "PHP File Inclusion",
    regex: /(?:include|require|include_once|require_once)\s*\(\s*\$(?:_GET|_POST|_REQUEST)/gi,
    severity: "Medium", category: "Injection", owasp: "A03:2021 - Injection",
    description: "PHP file inclusion uses user-controlled input. Enables Local/Remote File Inclusion (LFI/RFI) attacks.",
    fix: "Use a whitelist of allowed files. Never include files based on user input.",
  },
  {
    name: "Java XXE Vulnerability",
    regex: /DocumentBuilderFactory|SAXParserFactory|XMLInputFactory|TransformerFactory/g,
    severity: "Medium", category: "Injection", owasp: "A05:2021 - Security Misconfiguration",
    description: "XML parser detected. If external entities are not disabled, it's vulnerable to XXE attacks.",
    fix: "Disable DTDs and external entities: factory.setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true).",
  },
  {
    name: "Go HTTP Without TLS",
    regex: /http\.ListenAndServe\s*\(/g,
    severity: "Medium", category: "Configuration", owasp: "A02:2021 - Cryptographic Failures",
    description: "Go HTTP server without TLS. All traffic including credentials transmitted in plaintext.",
    fix: "Use http.ListenAndServeTLS() with valid certificates. Use Let's Encrypt for free TLS certs.",
  },
  {
    name: "Ruby System Command",
    regex: /(?:^|\s)(?:system|exec)\s*\(.*\#\{|%x\[.*\#\{|Open3\.\w+\s*\(/gm,
    severity: "Medium", category: "Injection", owasp: "A03:2021 - Injection",
    description: "Ruby shell command execution detected. If user input is included, command injection is possible.",
    fix: "Use array form of system(): system('cmd', arg1, arg2). Sanitize all input with Shellwords.escape().",
  },
  {
    name: "Exposed Error Details",
    regex: /(?:res\.(?:send|json|status))\s*\(\s*(?:err|error)(?:\.stack|\.message|\s*\))/gi,
    severity: "Medium", category: "Information Disclosure", owasp: "A05:2021 - Security Misconfiguration",
    description: "Raw error details or stack traces may be sent in API responses, exposing internal information.",
    fix: "Return generic error messages in production. Log detailed errors server-side only.",
  },
  {
    name: "Missing Auth on Sensitive Route",
    regex: /(?:app|router)\.(get|post|put|patch|delete)\s*\(\s*['"`]\/api\/(?:admin|user|account|settings|config|payment)/gi,
    severity: "Medium", category: "Authentication", owasp: "A01:2021 - Broken Access Control",
    description: "Sensitive API route may lack authentication middleware.",
    fix: "Add authentication middleware to all sensitive routes. Use RBAC for admin endpoints.",
  },
  {
    name: "No Rate Limiting on Auth",
    regex: /(?:app|router)\.(post)\s*\(\s*['"`].*(?:login|signin|auth|register|signup|forgot|reset)/gi,
    severity: "Medium", category: "Authentication", owasp: "A07:2021 - Identification Failures",
    description: "Auth endpoint without visible rate limiting. Allows brute-force and credential stuffing.",
    fix: "Add rate limiting (express-rate-limit). Implement account lockout and CAPTCHA.",
  },
  {
    name: "Unsafe Deserialization (JS)",
    regex: /JSON\.parse\s*\(\s*(?:req\.|params\.|query\.|body\.|atob|Buffer)/gi,
    severity: "Medium", category: "Code Quality", owasp: "A08:2021 - Data Integrity Failures",
    description: "JSON.parse on user input without error handling may cause crashes or prototype pollution.",
    fix: "Wrap JSON.parse in try-catch. Validate schema using Zod, Joi, or Yup.",
  },
  {
    name: "Python Flask Debug Mode",
    regex: /app\.run\s*\(.*debug\s*=\s*True/gi,
    severity: "Medium", category: "Configuration", owasp: "A05:2021 - Security Misconfiguration",
    description: "Flask running with debug=True exposes an interactive debugger that allows code execution.",
    fix: "Set debug=False in production. Use environment variables to toggle debug mode.",
  },
  {
    name: "Django SECRET_KEY Hardcoded",
    regex: /SECRET_KEY\s*=\s*['"`][A-Za-z0-9_\-!@#$%^&*]{20,}['"`]/gi,
    severity: "Medium", category: "Secret Leak", owasp: "A02:2021 - Cryptographic Failures",
    description: "Django SECRET_KEY is hardcoded. Used for session signing — compromise enables session hijacking.",
    fix: "Load SECRET_KEY from environment variable: os.environ.get('SECRET_KEY').",
  },

  // ═══════════════════════════════════════════════════════════════
  // MEDIUM — Docker & Infrastructure
  // ═══════════════════════════════════════════════════════════════
  {
    name: "Docker Running as Root",
    regex: /^\s*USER\s+root\s*$/gim,
    severity: "Medium", category: "Container Security", owasp: "A05:2021 - Security Misconfiguration",
    description: "Docker container runs as root user. Container escape vulnerabilities have higher impact.",
    fix: "Add a non-root USER instruction: USER node or USER appuser. Use --chown in COPY.",
  },
  {
    name: "Docker Latest Tag",
    regex: /^\s*FROM\s+\w+(?:\/\w+)?(?::latest|\s*$)/gim,
    severity: "Medium", category: "Container Security", owasp: "A08:2021 - Data Integrity Failures",
    description: "Docker image uses 'latest' tag or no tag. Builds are not reproducible and may pull vulnerable versions.",
    fix: "Pin specific image versions: FROM node:20-alpine instead of FROM node:latest.",
  },
  {
    name: "Terraform Open Security Group",
    regex: /cidr_blocks\s*=\s*\[\s*['"`]0\.0\.0\.0\/0['"`]\s*\]/gi,
    severity: "Medium", category: "Infrastructure", owasp: "A01:2021 - Broken Access Control",
    description: "Security group allows traffic from 0.0.0.0/0 (all IPs). Services are exposed to the internet.",
    fix: "Restrict CIDR blocks to specific trusted IPs or VPN ranges.",
  },
  {
    name: "Terraform Public S3 Bucket",
    regex: /acl\s*=\s*['"`]public-read['"`]|block_public_acls\s*=\s*false/gi,
    severity: "Medium", category: "Infrastructure", owasp: "A01:2021 - Broken Access Control",
    description: "S3 bucket configured with public access. Data may be exposed to anyone on the internet.",
    fix: "Set acl = 'private'. Enable block_public_acls, block_public_policy, ignore_public_acls.",
  },

  // ═══════════════════════════════════════════════════════════════
  // LOW — Best Practices & Info Disclosure
  // ═══════════════════════════════════════════════════════════════
  {
    name: "Debug Mode Enabled",
    regex: /(?:debug|DEBUG)\s*[:=]\s*(?:true|True|1|['"`]true['"`])/gi,
    severity: "Low", category: "Configuration", owasp: "A05:2021 - Security Misconfiguration",
    description: "Debug mode enabled. May expose stack traces and internal details in production.",
    fix: "Set debug to false in production. Use environment-based configuration.",
  },
  {
    name: "Security TODO/FIXME",
    regex: /(?:\/\/|#|\/\*)\s*(?:TODO|FIXME|HACK|XXX)\s*:?\s*.*(?:security|auth|password|credential|vuln|exploit|inject|xss|csrf)/gi,
    severity: "Low", category: "Code Quality", owasp: "A05:2021 - Security Misconfiguration",
    description: "TODO/FIXME mentions a security concern not yet addressed. Known security debt.",
    fix: "Resolve security TODOs before deploying. Track in your issue tracker.",
  },
  {
    name: "Wildcard CORS",
    regex: /(?:Access-Control-Allow-Origin|origin)\s*[:=(\s]*['"`]\*['"`]|cors\(\s*\)/gi,
    severity: "Low", category: "Configuration", owasp: "A05:2021 - Security Misconfiguration",
    description: "CORS allows all origins. Any website can make requests to your API.",
    fix: "Restrict CORS to specific trusted domains with an explicit origin whitelist.",
  },
  {
    name: "Hardcoded IP Address",
    regex: /['"`]\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d+)?['"`]/g,
    severity: "Low", category: "Configuration", owasp: "A05:2021 - Security Misconfiguration",
    description: "Hardcoded IP reduces flexibility and may expose internal network topology.",
    fix: "Use environment variables, DNS hostnames, or service discovery.",
  },
  {
    name: "Disabled Linter Rules",
    regex: /\/\/\s*eslint-disable(?!-next-line)|\/\/\s*@ts-ignore|#\s*nosec|\/\/\s*noinspection|#\s*noqa|@SuppressWarnings/g,
    severity: "Low", category: "Code Quality", owasp: "A05:2021 - Security Misconfiguration",
    description: "Linter/type checker rules broadly disabled. May suppress important security warnings.",
    fix: "Use inline disables for specific lines with explanations. Fix the underlying issues.",
  },
  {
    name: "Console Statements in Production",
    regex: /console\.(log|debug|info)\s*\(/g,
    severity: "Low", category: "Information Disclosure", owasp: "A09:2021 - Logging Failures",
    description: "Console statements can leak internal data to browser dev tools or server logs in production.",
    fix: "Remove console.log before deployment. Use a proper logging library with log levels.",
  },
  {
    name: "Exposed Source Map",
    regex: /sourceMappingURL\s*=|devtool\s*:\s*['"`](?:source-map|eval|cheap-module-source-map)['"`]|productionBrowserSourceMaps\s*:\s*true/gi,
    severity: "Low", category: "Information Disclosure", owasp: "A05:2021 - Security Misconfiguration",
    description: "Source maps exposed in production let attackers view original source code.",
    fix: "Disable source maps in production builds. Set productionBrowserSourceMaps: false.",
  },
  {
    name: "Insecure Cookie Config",
    regex: /(?:cookie|session)\s*(?:\(|:\s*\{)[\s\S]*?(?:secure\s*:\s*false|httpOnly\s*:\s*false|sameSite\s*:\s*['"`]none['"`])/gi,
    severity: "Low", category: "Configuration", owasp: "A07:2021 - Identification Failures",
    description: "Cookie configured without secure flags. Vulnerable to theft via XSS or HTTP interception.",
    fix: "Set cookies with secure: true, httpOnly: true, sameSite: 'strict'.",
  },
  {
    name: "Docker COPY with Secrets",
    regex: /^\s*COPY\s+.*(?:\.env|\.pem|\.key|id_rsa|credentials)/gim,
    severity: "Low", category: "Container Security", owasp: "A05:2021 - Security Misconfiguration",
    description: "Docker COPY may include secret files in the image. They persist in image layers.",
    fix: "Use .dockerignore to exclude secrets. Use build args or runtime secrets mounting.",
  },
  {
    name: "HTML Inline Event Handler",
    regex: /\bon(?:click|load|error|mouseover|focus|blur|submit|change)\s*=\s*['"`]/gi,
    severity: "Low", category: "XSS", owasp: "A03:2021 - Injection",
    description: "Inline event handlers in HTML are a CSP violation and XSS risk.",
    fix: "Use addEventListener() in JavaScript instead of inline event handlers.",
  },
  {
    name: "YAML Unsafe Load",
    regex: /yaml\.load\s*\(\s*(?!.*Loader\s*=\s*yaml\.SafeLoader)/gi,
    severity: "Low", category: "Code Quality", owasp: "A08:2021 - Data Integrity Failures",
    description: "yaml.load() without SafeLoader can execute arbitrary Python code from YAML files.",
    fix: "Use yaml.safe_load() or yaml.load(data, Loader=yaml.SafeLoader).",
  },
  {
    name: "Missing Input Validation",
    regex: /req\.(?:body|query|params)\.\w+/gi,
    severity: "Low", category: "Code Quality", owasp: "A03:2021 - Injection",
    description: "Request input used without visible validation or sanitization.",
    fix: "Validate all request input using schema validation (Zod, Joi, express-validator).",
  },
  {
    name: "Hardcoded Port Number",
    regex: /(?:listen|port|PORT)\s*[:=(]\s*(?:3000|8080|8000|5000|4000|9090)\b/g,
    severity: "Low", category: "Configuration", owasp: "A05:2021 - Security Misconfiguration",
    description: "Port number is hardcoded. Should be configurable via environment for different deployments.",
    fix: "Use process.env.PORT || defaultPort pattern for configurable ports.",
  },
  {
    name: "Potential Open Redirect",
    regex: /(?:href|src|action|redirect|url)\s*[:=]\s*(?:\$\{|`.*\$\{|.*\+\s*(?:req|params|query|input|user))/gi,
    severity: "Low", category: "Code Quality", owasp: "A01:2021 - Broken Access Control",
    description: "URL constructed from user input without validation. May enable open redirect attacks.",
    fix: "Validate URLs against an allowlist of permitted domains.",
  },
  {
    name: "Shell Script Unsafe Practices",
    regex: /^\s*(?:chmod\s+777|curl\s.*\|\s*(?:bash|sh)|wget\s.*\|\s*(?:bash|sh))/gm,
    severity: "Low", category: "Code Quality", owasp: "A03:2021 - Injection",
    description: "Shell script uses unquoted variables or sudo. May lead to injection or privilege escalation.",
    fix: "Quote all variables: \"$var\". Avoid sudo in scripts. Use principle of least privilege.",
  },
];

const severityWeights = { High: 20, Medium: 10, Low: 5 };

module.exports = { securityRules, severityWeights };
