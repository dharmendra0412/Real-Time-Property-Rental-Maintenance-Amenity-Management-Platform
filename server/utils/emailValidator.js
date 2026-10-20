const dns = require('dns');

// Configure trusted public DNS resolvers for consistent MX checks across platforms
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  // Use system default if setServers fails
}

// Comprehensive blacklist of known disposable, temporary, and dummy email domains
const DISPOSABLE_AND_DUMMY_DOMAINS = new Set([
  // Disposable & Temporary Mail Providers
  'mailinator.com', 'yopmail.com', 'yopmail.fr', 'yopmail.net', 'cool.fr.nf',
  '10minutemail.com', '10minutemail.net', '10minmail.com', '10minutemail.co.uk',
  'guerrillamail.com', 'guerrillamailblock.com', 'guerrillamail.net', 'guerrillamail.org',
  'tempmail.com', 'temp-mail.org', 'temp-mail.io', 'tempmailo.com', 'tempmailgen.com',
  'throwawaymail.com', 'trashmail.com', 'trashmail.net', 'trashmail.org',
  'sharklasers.com', 'grr.la', 'pokemail.net', 'spam4.me',
  'dispostable.com', 'fakeinbox.com', 'fakemailgenerator.com', 'getnada.com',
  'inboxkitten.com', 'burnermail.io', 'mohmal.com', 'mytemp.email',
  'crazymailing.com', 'nada.ltd', 'mailcatch.com', 'mailnesia.com',
  'spamgourmet.com', 'maildrop.cc', 'tempail.com', 'generator.email',
  'fakemail.net', 'emailondeck.com', 'crazymail.com', 'burneremail.com',
  'inboxbear.com', 'zillamail.com', 'dropmail.me', 'getairmail.com',
  'moakt.com', 'tmailor.com', 'tmpmail.org', 'bupmail.com', 'tmail.ws',
  'emailfake.com', 'fake-email-generator.com', 'crazyinbox.com', 'chacuo.net',

  // Placeholder, Fake & Test Domains
  'test.com', 'test.org', 'test.net',
  'example.com', 'example.org', 'example.net',
  'fake.com', 'fakemail.com', 'fakeemail.com', 'fakeaccount.com',
  'dummy.com', 'dummyemail.com', 'dummymail.com',
  'sample.com', 'samplemail.com',
  'asdf.com', 'asdfgh.com', 'qwerty.com', 'zxcv.com',
  'foo.com', 'bar.com', 'foobar.com', 'baz.com',
  'abc.com', 'xyz.com', 'temp.com', 'temporary.com',
  'invalid.com', 'invalid.org', 'local.com', 'localhost.com',
  'random.com', 'randommail.com', 'nomail.com', 'noemail.com',
  'nowhere.com', 'nothing.com', 'void.com', 'blank.com'
]);

// Well-known trusted mail domains that skip redundant DNS lookups for max performance
const TRUSTED_DOMAINS = new Set([
  'gmail.com', 'googlemail.com',
  'yahoo.com', 'ymail.com', 'rocketmail.com',
  'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
  'icloud.com', 'me.com', 'mac.com',
  'proton.me', 'protonmail.com',
  'zoho.com', 'zohomail.in',
  'aol.com', 'mail.com', 'gmx.com',
  'rediffmail.com', 'fastmail.com'
]);

/**
 * Validates an email address strictly for:
 * 1. Proper RFC syntax and length
 * 2. Ban on disposable / temporary burner inboxes
 * 3. Ban on dummy/placeholder domains
 * 4. Active DNS MX records to prove the domain actually exists and accepts mail
 * 
 * @param {string} email
 * @returns {Promise<{ valid: boolean, reason?: string, domain?: string }>}
 */
async function validateEmailStrict(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, reason: 'Email address is required.' };
  }

  const cleanEmail = email.trim().toLowerCase();

  // 1. Length constraints
  if (cleanEmail.length < 6 || cleanEmail.length > 254) {
    return { valid: false, reason: 'Email length must be between 6 and 254 characters.' };
  }

  // 2. Syntax check
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(cleanEmail)) {
    return { valid: false, reason: 'Please enter a valid email address format (e.g., name@gmail.com).' };
  }

  const [localPart, domain] = cleanEmail.split('@');

  // Disallow consecutive dots or leading/trailing dots in username
  if (localPart.includes('..') || localPart.startsWith('.') || localPart.endsWith('.')) {
    return { valid: false, reason: 'Email username cannot contain consecutive, leading, or trailing dots.' };
  }

  // Domain parts inspection
  const domainParts = domain.split('.');
  if (domainParts.length < 2) {
    return { valid: false, reason: 'Email must contain a complete domain name with extension (e.g. .com, .in).' };
  }

  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2 || !/^[a-z]+$/.test(tld)) {
    return { valid: false, reason: `The domain extension '.${tld}' is invalid.` };
  }

  // 3. Check for disposable & dummy domains (and subdomains)
  for (const blocked of DISPOSABLE_AND_DUMMY_DOMAINS) {
    if (domain === blocked || domain.endsWith('.' + blocked)) {
      return {
        valid: false,
        reason: 'Temporary, disposable, and test emails are not allowed. Please use a permanent email address (e.g., Gmail, Outlook, Yahoo, or your official email).'
      };
    }
  }

  // 4. Fast path: if domain is a known major global mail provider, pass immediately
  if (TRUSTED_DOMAINS.has(domain)) {
    return { valid: true, domain };
  }

  // 5. Live DNS MX Verification: check if the domain actually has mail exchange servers
  try {
    const resolvePromise = dns.promises.resolveMx(domain);
    // Timeout of 2.5 seconds so slow DNS never blocks registration
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('DNS_TIMEOUT')), 2500)
    );

    const mxRecords = await Promise.race([resolvePromise, timeoutPromise]);
    if (mxRecords && mxRecords.length > 0) {
      return { valid: true, domain };
    }
  } catch (err) {
    if (err.code === 'ENOTFOUND') {
      return {
        valid: false,
        reason: `The domain '@${domain}' does not exist on the internet. Please provide a genuine, active email address.`
      };
    }
    if (err.code === 'ENODATA') {
      // Domain exists but has no MX record. Check if it has an A record (RFC 5321 fallback)
      try {
        const aRecords = await dns.promises.resolve4(domain);
        if (aRecords && aRecords.length > 0) {
          return { valid: true, domain };
        }
      } catch (aErr) {
        return {
          valid: false,
          reason: `The domain '@${domain}' cannot receive emails (no active mail exchange servers found).`
        };
      }
    }
    // If DNS query timed out or had temporary network resolution error, allow valid-looking domain
  }

  return { valid: true, domain };
}

module.exports = {
  validateEmailStrict,
  DISPOSABLE_AND_DUMMY_DOMAINS,
  TRUSTED_DOMAINS
};
