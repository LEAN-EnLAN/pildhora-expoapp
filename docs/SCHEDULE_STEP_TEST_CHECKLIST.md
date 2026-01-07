# Schedule Step Testing Checklist

## Pre-Testing Setup

- [ ] Pull latest code changes
- [ ] Run `npm install` (if needed)
- [ ] Clear build cache
- [ ] Restart Metro bundler

## iOS Testing

### Modal Behavior
- [ ] Tap "Agregar horario" - modal slides up smoothly
- [ ] Modal has rounded top corners
- [ ] Backdrop is semi-transparent (50% black)
- [ ] Tap backdrop - modal dismisses
- [ ] Tap inside modal - modal stays open
- [ ] SafeAreaView works on notched devices (iPhone X+)

### Time Picker
- [ ] Spinner displays correctly
- [ ] Can scroll to select hours
- [ ] Can scroll to select minutes
- [ ] Time updates in real-time as you scroll
- [ ] Respects device 12/24 hour setting

### Buttons
- [ ] "Cancelar" button works - dismisses without saving
- [ ] "Confirmar" button works - saves and dismisses
- [ ] Buttons have proper spacing
- [ ] Buttons are easy to tap
- [ ] Hit slop makes tapping easier

### Time Management
- [ ] Add time - appears in list
- [ ] Edit time - opens modal with current time
- [ ] Remove time - removes from list (min 1 time)
- [ ] Times sort chronologically
- [ ] Can add up to 6 times

## Android Testing

### Time Picker
- [ ] Native Android picker appears
- [ ] Material Design styling
- [ ] Can select hours
- [ ] Can select minutes
- [ ] Respects device 12/24 hour setting
- [ ] "OK" saves time
- [ ] "Cancel" dismisses without saving

### Time Management
- [ ] Add time - appears in list
- [ ] Edit time - opens picker with current time
- [ ] Remove time - removes from list (min 1 time)
- [ ] Times sort chronologically
- [ ] Can add up to 6 times

## Visual Testing (Both Platforms)

### Spacing
- [ ] Header has 24px bottom margin
- [ ] Sections have 24px bottom margin
- [ ] Time buttons have 16px padding
- [ ] Time list has 12px gap between items
- [ ] Day chips have 12px gap
- [ ] Content has 16px side padding
- [ ] Bottom padding is adequate (64px)

### Typography
- [ ] Title is 24px, bold, readable
- [ ] Subtitle is 16px, gray, readable
- [ ] Section labels are 16px, semibold
- [ ] Helper text is 14px, gray
- [ ] Time text is 20px, semibold
- [ ] All text has good contrast

### Touch Targets
- [ ] Time buttons are 60px height - easy to tap
- [ ] Remove buttons are 48x48 - easy to tap
- [ ] Add button is 60px height - easy to tap
- [ ] Day chips are 48x48 - easy to tap
- [ ] All buttons respond to taps

### Visual Polish
- [ ] Time buttons have subtle shadow
- [ ] Borders are visible (1.5-2px)
- [ ] Border colors are soft (gray-200)
- [ ] Icons are 28px - clearly visible
- [ ] Timeline dots are 28px with shadow
- [ ] Info box has left border accent

## Functional Testing

### Time Selection
- [ ] Can add first time
- [ ] Can add multiple times (up to 6)
- [ ] Can edit existing time
- [ ] Can remove time (keeps min 1)
- [ ] Times display in correct format
- [ ] Times sort automatically

### Day Selection
- [ ] Can select individual days
- [ ] Can deselect days (keeps min 1)
- [ ] Selected days show as filled
- [ ] Unselected days show as outlined
- [ ] All 7 days work correctly

### Timeline
- [ ] Timeline displays correctly
- [ ] Hour markers show (0, 6, 12, 18, 24)
- [ ] Time dots appear at correct positions
- [ ] Time labels show below dots
- [ ] Updates when times change

### Validation
- [ ] Can't proceed with no times
- [ ] Can't proceed with no days
- [ ] Can proceed with valid data
- [ ] Validation updates in real-time

### Navigation
- [ ] Can go back to previous step
- [ ] Data persists when going back
- [ ] Can proceed to next step when valid
- [ ] Can't proceed when invalid

## Accessibility Testing

### iOS VoiceOver
- [ ] Enable VoiceOver in Settings
- [ ] Swipe through all elements
- [ ] All buttons have labels
- [ ] Time buttons announce time
- [ ] Day chips announce day name
- [ ] Modal announces correctly
- [ ] Can navigate with gestures
- [ ] Can activate buttons with double-tap

### Android TalkBack
- [ ] Enable TalkBack in Settings
- [ ] Swipe through all elements
- [ ] All buttons have labels
- [ ] Time buttons announce time
- [ ] Day chips announce day name
- [ ] Picker announces correctly
- [ ] Can navigate with gestures
- [ ] Can activate buttons with double-tap

### Touch Targets
- [ ] All buttons ≥ 48x48 (measure if needed)
- [ ] Easy to tap without precision
- [ ] No accidental taps on nearby elements
- [ ] Hit slop makes small buttons easier

### Visual Accessibility
- [ ] Text is readable at normal size
- [ ] Text is readable at large size (accessibility settings)
- [ ] Colors have sufficient contrast
- [ ] Focus indicators are visible
- [ ] No information conveyed by color alone

## Device Testing

### iOS Devices
- [ ] iPhone SE (small screen)
- [ ] iPhone 14 (standard)
- [ ] iPhone 14 Pro (notch)
- [ ] iPhone 14 Pro Max (large)
- [ ] iPad (tablet)

### Android Devices
- [ ] Small phone (< 5.5")
- [ ] Standard phone (5.5-6.5")
- [ ] Large phone (> 6.5")
- [ ] Tablet

### Orientations
- [ ] Portrait mode works
- [ ] Landscape mode works (if applicable)

## Performance Testing

### Rendering
- [ ] Screen loads quickly
- [ ] No lag when scrolling
- [ ] Animations are smooth (60fps)
- [ ] No jank when opening modal
- [ ] No jank when updating times

### Memory
- [ ] No memory leaks
- [ ] App doesn't crash
- [ ] Modal opens/closes without issues

## Edge Cases

### Boundary Conditions
- [ ] Add 6 times - can't add more
- [ ] Remove times until 1 left - can't remove
- [ ] Deselect days until 1 left - can't deselect
- [ ] Select all 7 days - works correctly

### Data Validation
- [ ] Times validate correctly
- [ ] Invalid times don't save
- [ ] Frequency validates correctly
- [ ] Context updates properly

### User Errors
- [ ] Try to remove last time - prevented
- [ ] Try to deselect last day - prevented
- [ ] Cancel modal - no changes saved
- [ ] Tap backdrop - modal dismisses

## Integration Testing

### Wizard Flow
- [ ] Navigate from Step 1 to Step 2
- [ ] Data from Step 1 persists
- [ ] Navigate from Step 2 to Step 3
- [ ] Data from Step 2 persists
- [ ] Navigate back to Step 2
- [ ] Data is still there

### Context Updates
- [ ] Times update in context
- [ ] Frequency updates in context
- [ ] Validation updates canProceed
- [ ] Changes persist across navigation

## Regression Testing

### Existing Functionality
- [ ] All previous features still work
- [ ] No new bugs introduced
- [ ] Performance not degraded
- [ ] Accessibility not broken

## Sign-Off

### Developer
- [ ] Code reviewed
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Documentation updated

### QA
- [ ] All tests passed
- [ ] No critical bugs
- [ ] Accessibility verified
- [ ] Ready for production

### Product
- [ ] UX approved
- [ ] Design approved
- [ ] Meets requirements
- [ ] Ready to ship

## Notes

### Issues Found
(List any issues discovered during testing)

### Improvements Needed
(List any improvements that could be made)

### Follow-Up Tasks
(List any tasks that need to be done after release)

---

**Testing Date:** ___________
**Tester Name:** ___________
**Platform:** iOS / Android
**Device:** ___________
**OS Version:** ___________
**App Version:** ___________

**Overall Status:** ☐ Pass ☐ Fail ☐ Needs Review

**Notes:**
