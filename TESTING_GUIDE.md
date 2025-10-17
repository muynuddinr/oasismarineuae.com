# Testing Guide - Product Enquiry System

## ✅ Quick Testing Checklist

### 1. Test Contact Form (Non-Authenticated User)
```
1. Open any product detail page
2. Click "Contact Us" button
3. Fill in:
   - Name: Test User
   - Email: test@example.com
   - Phone: +971123456789 (optional)
   - Message: I'm interested in this product
4. Click "Send Message"
5. ✅ Should see success message
6. ✅ Modal should auto-close after 3 seconds
```

### 2. Test Contact Form (Authenticated User)
```
1. Sign in with Google
2. Go to product detail page
3. Click "Contact Us" button
4. ✅ Name and Email should be pre-filled (disabled)
5. Fill message and submit
6. ✅ Should see success message
```

### 3. Test Admin Access
```
Step 1: Make yourself admin first!

In MongoDB Compass or CLI, run:
db.users.updateOne(
  { email: "YOUR_GOOGLE_EMAIL@gmail.com" },
  { $set: { role: "admin" } }
)

Step 2: Access admin panel
1. Sign in with your admin account
2. Go to: http://localhost:3000/admin/contacts
3. ✅ Should see all contact submissions
4. ✅ Can filter by status/priority
5. ✅ Can search contacts
6. ✅ Can view details
7. ✅ Can mark as read/replied
8. ✅ Can delete contacts
```

### 4. Test Security
```
Test 1: Non-admin accessing admin page
1. Sign in as regular user (not admin)
2. Try to go to /admin/contacts
3. ✅ Should redirect to home page
4. ✅ Should show "no admin access" toast

Test 2: Direct API access
1. Open browser console
2. Try: fetch('/api/contacts')
3. ✅ Should get 401 or 403 error
```

## 🐛 Common Issues & Solutions

### Issue: "Authentication required" error
**Solution:** Sign in first, or for admin pages, make sure you're an admin

### Issue: Contact form not submitting
**Solution:** Check all required fields (Name, Email, Message)

### Issue: Admin page shows "no access"
**Solution:** 
1. Check if you're logged in
2. Verify your user has role: 'admin' in database
3. Clear browser cache and cookies

### Issue: Success message not showing
**Solution:** Check browser console for errors, API might be returning error

## 📊 Expected Database Structure

### contacts collection:
```javascript
{
  _id: ObjectId("..."),
  name: "John Doe",
  email: "john@example.com",
  phone: "+971123456789",
  subject: "Inquiry about Globe Valve PN16",
  message: "I need pricing and availability",
  status: "new",
  priority: "medium",
  enquiryType: "product",
  productId: ObjectId("..."),
  productName: "Globe Valve PN16",
  productImage: "/products/valve.jpg",
  userId: ObjectId("..."), // Optional
  createdAt: ISODate("2025-10-15T..."),
  updatedAt: ISODate("2025-10-15T...")
}
```

### users collection (admin):
```javascript
{
  _id: ObjectId("..."),
  name: "Admin User",
  email: "admin@example.com",
  role: "admin", // ← Important!
  image: "https://...",
  emailVerified: ISODate("..."),
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

## 🎯 Manual Testing Steps

### Test 1: Submit Product Enquiry
- [ ] Open product page
- [ ] Click "Contact Us"
- [ ] Fill form completely
- [ ] Submit successfully
- [ ] See thank you message
- [ ] Modal closes automatically

### Test 2: View in Admin Panel
- [ ] Login as admin
- [ ] Navigate to /admin/contacts
- [ ] See submitted enquiry
- [ ] View all details (name, email, product info)
- [ ] Check timestamps are correct

### Test 3: Admin Actions
- [ ] Select a contact
- [ ] Mark as "Read" - status changes to yellow
- [ ] Mark as "Replied" - status changes to green
- [ ] Delete contact - removed from list

### Test 4: Filters & Search
- [ ] Filter by status (New/Read/Replied)
- [ ] Filter by priority (High/Medium/Low)
- [ ] Search by name/email/subject
- [ ] All filters work correctly

## 📝 Verification Checklist

After implementation:
- [ ] Non-authenticated users can submit enquiries
- [ ] Authenticated users see pre-filled info
- [ ] Success message appears after submission
- [ ] Admin page requires authentication
- [ ] Admin page requires admin role
- [ ] All CRUD operations work
- [ ] Product information is captured
- [ ] User information is linked
- [ ] Filters and search work
- [ ] Toast notifications appear
- [ ] No console errors

## 🚀 Ready to Go!

All features are implemented. Just need to:
1. Make at least one user an admin in the database
2. Test the contact form
3. Test the admin panel

Everything should work smoothly! 🎉
