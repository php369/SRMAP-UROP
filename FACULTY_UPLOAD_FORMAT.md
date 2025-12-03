# Faculty Upload Format

## Problem
When uploading faculty lists, the system was expecting student fields (year, semester) which don't apply to faculty members.

## Solution
Created a separate faculty upload endpoint that uses the FacultyRoster model instead of Eligibility.

## CSV Format for Faculty

### Required Columns:
1. **email** - Faculty email (must end with @srmap.edu.in)
2. **name** - Full name of faculty member
3. **department** - Department name

### Optional Columns:
4. **isCoordinator** - Whether faculty is a coordinator (true/false, yes/no, 1/0)

### Example CSV:

```csv
email,name,department,isCoordinator
john.doe@srmap.edu.in,Dr. John Doe,Computer Science,true
jane.smith@srmap.edu.in,Dr. Jane Smith,Information Technology,false
bob.wilson@srmap.edu.in,Prof. Bob Wilson,Computer Science,no
```

### Notes:
- Header row is required
- Email must end with @srmap.edu.in
- isCoordinator is optional (defaults to false)
- Accepted values for isCoordinator: true/false, yes/no, y/n, 1/0 (case-insensitive)
- If a faculty member already exists, their record will be updated

## API Endpoints

### Upload Faculty Roster
**POST** `/api/v1/eligibility/faculty/upload`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body:**
```json
{
  "csvData": "email,name,department,isCoordinator\njohn.doe@srmap.edu.in,Dr. John Doe,Computer Science,true"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": 5,
    "updated": 2,
    "failed": 0,
    "errors": []
  },
  "message": "Upload completed: 5 created, 2 updated, 0 failed"
}
```

### Get Faculty Roster
**GET** `/api/v1/eligibility/faculty`

**Query Parameters:**
- `dept` - Filter by department
- `isCoordinator` - Filter by coordinator status (true/false)
- `active` - Filter by active status (true/false)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "email": "john.doe@srmap.edu.in",
      "name": "Dr. John Doe",
      "dept": "Computer Science",
      "isCoordinator": true,
      "active": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

### Update Faculty Record
**PUT** `/api/v1/eligibility/faculty/:email`

**Body:**
```json
{
  "name": "Dr. John Doe Updated",
  "dept": "Computer Science",
  "isCoordinator": false,
  "active": true
}
```

### Delete Faculty Record
**DELETE** `/api/v1/eligibility/faculty/:email`

## Comparison: Student vs Faculty Upload

### Student Eligibility CSV:
```csv
email,regNo,year,semester
student@srmap.edu.in,AP21110010001,3,7
```

**Endpoint:** `POST /api/v1/eligibility/upload`

**Required Fields:**
- email
- year (2, 3, or 4)
- semester (3, 4, 7, or 8)
- projectType (IDP, UROP, CAPSTONE)

### Faculty Roster CSV:
```csv
email,name,department,isCoordinator
faculty@srmap.edu.in,Dr. Faculty Name,Computer Science,false
```

**Endpoint:** `POST /api/v1/eligibility/faculty/upload`

**Required Fields:**
- email
- name
- department

**Optional Fields:**
- isCoordinator (defaults to false)

## Files Created/Modified

### New Files:
- `apps/api/src/services/facultyService.ts` - Faculty roster service

### Modified Files:
- `apps/api/src/routes/eligibility.ts` - Added faculty upload routes

## Testing

### Test Faculty Upload:
```bash
# Create test CSV
cat > faculty.csv << EOF
email,name,department,isCoordinator
test.faculty@srmap.edu.in,Dr. Test Faculty,Computer Science,true
EOF

# Convert to JSON format
CSV_DATA=$(cat faculty.csv)

# Upload (replace TOKEN with actual admin token)
curl -X POST http://localhost:3001/api/v1/eligibility/faculty/upload \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"csvData\": \"$CSV_DATA\"}"
```

### Test Get Faculty:
```bash
curl http://localhost:3001/api/v1/eligibility/faculty \
  -H "Authorization: Bearer $TOKEN"
```

## Error Handling

### Common Errors:

1. **Invalid Email Domain**
   ```json
   {
     "success": false,
     "error": {
       "code": "INVALID_EMAIL_DOMAIN",
       "message": "Invalid email domain at line 2: faculty@gmail.com. Must end with @srmap.edu.in"
     }
   }
   ```

2. **Missing Required Fields**
   ```json
   {
     "success": false,
     "error": {
       "code": "INVALID_CSV_FORMAT",
       "message": "Invalid CSV format at line 2. Expected: email,name,department[,isCoordinator]"
     }
   }
   ```

3. **Missing CSV Data**
   ```json
   {
     "success": false,
     "error": {
       "code": "MISSING_REQUIRED_FIELDS",
       "message": "csvData is required"
     }
   }
   ```

## Benefits

✅ **Separate Models**: Faculty and students use appropriate models  
✅ **No Year/Semester**: Faculty don't need student-specific fields  
✅ **Update Support**: Existing faculty records are updated, not duplicated  
✅ **Coordinator Flag**: Easy to mark coordinators during upload  
✅ **Validation**: Proper email domain and field validation  
✅ **Error Reporting**: Detailed error messages for each failed record  

## Next Steps

To use the faculty upload in the frontend:
1. Update the EligibilityUpload component to support faculty CSV format
2. Add a toggle or separate section for faculty uploads
3. Show appropriate CSV format examples based on upload type
4. Display upload results with created/updated/failed counts
