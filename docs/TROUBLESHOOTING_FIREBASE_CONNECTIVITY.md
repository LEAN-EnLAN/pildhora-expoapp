# Troubleshooting Firebase Connectivity Issues

## Problem: DNS Resolution Errors

If you're seeing errors like:
- `GET https://apis.google.com/js/api.js?onload=__iframefcb333962 net::ERR_NAME_NOT_RESOLVED`
- `POST https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=... net::ERR_NAME_NOT_RESOLVED`

This is likely caused by DNS hijacking from your ISP.

## Root Cause

Some ISPs (particularly in certain regions) implement DNS hijacking that redirects Google domains to local variants. For example:
- `apis.google.com` → `apis.google.com.com.ar`
- `identitytoolkit.googleapis.com` → `identitytoolkit.googleapis.com.com.ar`

These redirected domains don't have the proper SSL certificates or endpoints for Firebase services, causing connection failures.

## Solutions

### Solution 1: Change DNS Servers (Recommended)

Change your device or router DNS settings to use public DNS servers:

#### Google DNS
- Primary: `8.8.8.8`
- Secondary: `8.8.4.4`

#### Cloudflare DNS
- Primary: `1.1.1.1`
- Secondary: `1.0.0.1`

#### Windows Instructions:
1. Go to Control Panel → Network and Internet → Network and Sharing Center
2. Click "Change adapter settings"
3. Right-click your active connection → Properties
4. Select "Internet Protocol Version 4 (TCP/IPv4)" → Properties
5. Select "Use the following DNS server addresses"
6. Enter the DNS servers above
7. Click OK and restart your browser/app

#### Router Instructions:
1. Access your router's admin panel (usually 192.168.1.1 or 192.168.0.1)
2. Find DNS settings in the network configuration
3. Replace ISP DNS with the public DNS servers above
4. Save and restart the router

### Solution 2: Use VPN
A VPN can bypass DNS hijacking by routing your traffic through servers in different regions.

### Solution 3: Use Mobile Hotspot
As a temporary test, try using your mobile phone's hotspot to see if the issue persists.

## Verification

After changing DNS settings, verify the fix:

1. Open Command Prompt/Terminal
2. Run: `nslookup apis.google.com`
3. The response should show Google's actual IP addresses (not local variants)
4. Run: `nslookup identitytoolkit.googleapis.com`
5. Verify it resolves to Google's servers

## Code Improvements

The app now includes network diagnostics that will:
1. Check connectivity to Firebase services on startup
2. Provide detailed error messages if DNS issues are detected
3. Log helpful troubleshooting information in the console

## Common ISPs Known for DNS Hijacking

- Fibertel (Argentina)
- Some regional ISPs in South America
- Certain corporate networks

## Additional Tips

1. **Flush DNS cache** after changing DNS settings:
   - Windows: `ipconfig /flushdns`
   - Mac: `sudo dscacheutil -flushcache`
   - Linux: `sudo systemctl restart systemd-resolved`

2. **Clear browser cache** to ensure fresh DNS lookups

3. **Restart your development server** after making network changes

## When to Contact Support

If you've tried all the above solutions and still experience issues:
1. Document the exact error messages
2. Include the output of `nslookup` commands
3. Specify your ISP and region
4. Mention any VPN or proxy configurations

This information will help diagnose any deeper network issues.