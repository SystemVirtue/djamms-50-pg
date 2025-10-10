# DJAMMS Admin User Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Player Controls](#player-controls)
3. [Queue Management](#queue-management)
4. [System Settings](#system-settings)
5. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Accessing the Admin Panel

1. **Login**: Navigate to `https://auth.djamms.app` (or your auth URL)
2. **Enter Email**: Use your registered admin email address
3. **Magic Link**: Check your email for the login link
4. **Select Venue**: Choose your venue from the dashboard
5. **Admin Panel**: You'll be redirected to `https://admin.djamms.app/admin/{venueId}`

### Admin Interface Overview

The admin panel has three main tabs:

📺 **Player Controls** - Control playback in real-time  
📋 **Queue Management** - View and manage the song queue  
⚙️ **System Settings** - Configure venue settings

---

## Player Controls

### Overview
Remote control for the master player in your venue. Changes take effect immediately.

### Current Track Display

The "Now Playing" card shows:
- **Track Title**: Song name
- **Artist**: Artist or channel name
- **Duration**: Total track length
- **Progress**: Current playback position
- **Requester**: Who requested the song (if applicable)

### Play/Pause Button

**Purpose**: Start or stop playback

**How to Use**:
1. Click the ▶️ (Play) or ⏸️ (Pause) button
2. Player responds within 1 second
3. Button icon updates to reflect new state

**When to Use**:
- Start music when venue opens
- Pause during announcements
- Pause during emergencies
- Resume after breaks

### Skip Button

**Purpose**: Skip to the next track in queue

**How to Use**:
1. Click the ⏭️ (Skip) button
2. Current track ends immediately
3. Next track in queue begins playing

**When to Use**:
- Song is inappropriate
- Technical issues with track
- Customer requests removal
- Wrong song played

**Note**: Skipped songs are removed from queue

### Volume Control

**Purpose**: Adjust master playback volume

**How to Use**:
1. Drag the volume slider left (quieter) or right (louder)
2. Or click a position on the slider track
3. Volume changes immediately
4. Range: 0 (mute) to 100 (maximum)

**Recommended Levels**:
- **Background Music**: 30-50
- **Normal Operation**: 50-70
- **Busy Hours**: 70-85
- **Special Events**: 85-100

**Tips**:
- Adjust based on crowd noise
- Start lower, increase as needed
- Avoid 100% for extended periods

---

## Queue Management

### Overview
View and manage all songs in the queue, including priority and standard requests.

### Queue Statistics

Three stat cards show:
1. **Total Tracks**: Total songs in both queues
2. **Priority Requests**: Number of priority songs
3. **Total Duration**: Combined playtime of all tracks

### Priority Queue

**What It Is**: Songs that play before standard queue

**Characteristics**:
- Orange "Priority" badge
- Plays first, regardless of position
- Typically costs more credits (PAID mode)
- Shows in separate section

**Managing Priority Tracks**:
- Review priority requests first
- Remove if inappropriate
- Clear all if needed

### Main Queue

**What It Is**: Standard song requests

**Characteristics**:
- Standard request badge
- Plays in order after priority queue
- Free in FREEPLAY mode
- Costs credits in PAID mode

### Track Information

Each track card shows:
- **Position Number**: Order in queue
- **Thumbnail**: YouTube video thumbnail
- **Title**: Song name
- **Artist**: Artist or channel
- **Duration**: Track length
- **Requester**: Username (if provided)
- **Type**: Request vs. Autoplay

### Removing Tracks

**Single Track**:
1. Find the track to remove
2. Click the 🗑️ (trash) icon
3. Confirm if prompted
4. Track removed immediately

**All Tracks**:
1. Click "Clear All" button
2. Confirm the action
3. Entire queue cleared

**When to Remove**:
- Inappropriate content
- Duplicate requests
- Technical issues
- Customer refund request

### Real-Time Updates

Queue updates automatically when:
- Customer submits new request
- Track finishes playing
- You remove a track
- Other admins make changes

**No refresh needed** - changes appear instantly

---

## System Settings

### Overview
Configure venue operating mode, costs, and integrations.

### Venue Name

**Purpose**: Display name for your venue

**How to Change**:
1. Click in "Venue Name" field
2. Type new name (max 128 characters)
3. Click "Save Settings"

**Where It Appears**:
- Admin panel header
- Player display (optional)
- Customer receipts (if billing)

### Operating Mode

Two modes available:

#### FREEPLAY Mode
- ✅ Customers request songs for free
- ✅ No payment integration needed
- ✅ Unlimited requests (optional rate limiting)
- ✅ Good for bars, casual venues

**When to Use**:
- Bar/restaurant with free jukebox
- Promotional periods
- House parties/events
- Testing the system

#### PAID Mode
- 💳 Customers pay credits for requests
- 💳 Priority requests available
- 💳 Requires credit system integration
- 💳 Good for commercial venues

**When to Use**:
- Revenue-generating jukebox
- Busy venues with high demand
- Priority request feature wanted
- Commercial installations

**Switching Modes**:
1. Click "FREEPLAY" or "PAID" button
2. Settings show/hide based on mode
3. Click "Save Settings"
4. Takes effect immediately

### Credit Costs (PAID Mode Only)

**Standard Request Cost**:
- Credits required for normal request
- Typical: 1-5 credits
- Recommendation: 2 credits

**Priority Request Cost**:
- Credits required for priority request
- Typical: 3-10 credits
- Recommendation: 5 credits (2.5x standard)

**Setting Costs**:
1. Enter number in "Standard Request Cost"
2. Enter number in "Priority Request Cost"
3. Ensure priority > standard
4. Click "Save Settings"

**Pricing Strategy**:
- Consider local market
- Balance demand vs. revenue
- Monitor queue length
- Adjust based on peak hours

### YouTube API Key

**Purpose**: Required for song search functionality

**How to Set Up**:

1. **Get API Key**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create new project
   - Enable "YouTube Data API v3"
   - Create API key
   - Copy the key

2. **Add to DJAMMS**:
   - Paste key in "YouTube API Key" field
   - Click "Save Settings"
   - Key is encrypted/hidden

3. **Test**:
   - Go to Kiosk endpoint
   - Try searching for a song
   - If results appear, key is working

**Security**:
- Key is stored securely
- Displayed as password (••••)
- Only you can change it

**Quota Limits**:
- Free tier: 10,000 queries/day
- Typically sufficient for most venues
- Monitor in Google Cloud Console

### Unsaved Changes

**Warning Indicator**:
- Appears when you edit any field
- Shows "⚠️ You have unsaved changes"
- Prevents accidental data loss

**Saving Changes**:
1. Make all desired changes
2. Review warning message
3. Click "Save Settings" button
4. Success toast appears
5. Warning disappears

**Discarding Changes**:
- Refresh the page
- Switch tabs (changes lost)
- Click "Discard" if available

---

## Troubleshooting

### Player Not Responding

**Symptoms**: Commands don't affect playback

**Solutions**:
1. Check connection status (green dot in header)
2. Refresh admin panel
3. Check if player endpoint is running
4. Verify network connection
5. Check AppWrite status

### Queue Not Updating

**Symptoms**: New requests don't appear

**Solutions**:
1. Refresh the page
2. Check AppWrite realtime connection
3. Verify database permissions
4. Check browser console for errors
5. Test with manual queue add

### Volume Not Changing

**Symptoms**: Slider moves but volume stays same

**Solutions**:
1. Check master player is running
2. Verify player has audio permissions
3. Check system volume isn't muted
4. Test with different browser
5. Restart player endpoint

### Settings Not Saving

**Symptoms**: Changes revert after save

**Solutions**:
1. Check for error toast message
2. Verify all required fields filled
3. Check AppWrite connection
4. Verify admin permissions
5. Check browser console

### Can't Remove Tracks

**Symptoms**: Remove button doesn't work

**Solutions**:
1. Check admin permissions
2. Verify database connection
3. Check track still exists
4. Refresh queue view
5. Use "Clear All" as workaround

### Priority Queue Issues

**Symptoms**: Priority songs not playing first

**Solutions**:
1. Verify venue in PAID mode
2. Check priority queue section
3. Ensure isPriority flag set
4. Restart player if needed
5. Check player logic

---

## Best Practices

### Daily Operations

**Opening**:
1. Check connection status
2. Review queue
3. Start playback
4. Set appropriate volume

**During Service**:
1. Monitor queue length
2. Remove inappropriate content
3. Adjust volume as needed
4. Handle customer issues

**Closing**:
1. Pause playback
2. Review day's stats
3. Clear queue if desired
4. Check for issues

### Queue Management

**Guidelines**:
- Review new requests regularly
- Remove duplicates
- Balance priority vs. standard
- Keep queue under 2 hours
- Monitor for inappropriate content

### Customer Service

**Common Requests**:
- "Can you skip this song?" → Use Skip button
- "Why isn't my song playing?" → Check queue position
- "I want a refund" → Remove track, process refund
- "Can you play my song next?" → May need priority upgrade

### Security

**Protect Your Access**:
- Don't share login email
- Don't share magic links
- Log out on shared devices
- Monitor for unauthorized changes
- Report suspicious activity

### Performance Tips

**Optimize Experience**:
- Keep browser tab active
- Use modern browser (Chrome/Edge/Firefox)
- Stable internet connection
- Close unused tabs
- Refresh periodically

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play/Pause |
| `→` | Skip Track |
| `↑` | Volume Up |
| `↓` | Volume Down |
| `Ctrl+1` | Player Controls Tab |
| `Ctrl+2` | Queue Management Tab |
| `Ctrl+3` | System Settings Tab |

*(May require focus on specific element)*

---

## Support

### Need Help?

**Technical Issues**:
- Check TROUBLESHOOTING section
- Review browser console
- Check network connection
- Test in different browser

**Feature Requests**:
- Document desired feature
- Include use case
- Describe expected behavior

**Bug Reports**:
- Describe what happened
- What you expected
- Steps to reproduce
- Browser and version
- Screenshots if possible

---

## Appendix

### Venue Status Indicators

| Indicator | Meaning |
|-----------|---------|
| 🟢 Green Pulse | Connected |
| 🟡 Yellow | Reconnecting |
| 🔴 Red | Disconnected |

### Queue Badge Colors

| Color | Type |
|-------|------|
| 🟠 Orange | Priority Request |
| 🔵 Blue | Standard Request |
| ⚪ Gray | Autoplay Track |

### Credit Recommendations

| Venue Type | Standard | Priority |
|------------|----------|----------|
| Small Bar | 1 | 3 |
| Restaurant | 2 | 5 |
| Large Venue | 3 | 7 |
| Club | 5 | 10 |

---

**Version**: 1.0  
**Last Updated**: January 2025  
**For**: DJAMMS Admin Panel v1.0
