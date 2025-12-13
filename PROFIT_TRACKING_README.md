# Admin Dashboard - Profit Tracking & Facebook Ads Management

## Overview
The admin dashboard has been enhanced with professional profit tracking tools and Facebook Ads campaign management to help you monitor your business growth and calculate your overall profit.

## New Features

### 1. **Profit & Marketing Analytics Dashboard**
The dashboard now displays comprehensive profit metrics:

- **Total Revenue**: Sum of all course sales
- **Facebook Ads Spend**: Total amount spent on advertising
- **Net Profit**: Revenue minus ad spend
- **Profit Margin**: Percentage of profit relative to revenue
- **ROAS (Return on Ad Spend)**: How much revenue you earn for every dollar spent on ads
- **Average Order Value**: Average amount per course purchase

### 2. **Facebook Ad Campaign Management**
Track all your Facebook advertising campaigns in one place:

#### Features:
- **Add Campaign**: Record new ad campaigns with:
  - Campaign Name
  - Spend Amount (in DA)
  - Start Date
  - End Date (optional, leave empty for ongoing campaigns)
  - Notes

- **Edit Campaign**: Update existing campaign details
- **Delete Campaign**: Remove campaigns you no longer need
- **View All Campaigns**: See all your campaigns with spend amounts and date ranges

#### How to Use:
1. Click "Add Campaign" button in the Facebook Ad Campaigns section
2. Fill in the campaign details
3. Click "Save Campaign"
4. Your profit metrics will automatically update

### 3. **Quick Profit Calculator**
Real-time profit calculation that automatically updates based on:
- Total Revenue from all sales
- Total Ad Spend from all campaigns
- Net Profit (Revenue - Ad Spend)
- Profit Margin percentage

### 4. **Monthly Performance Overview**
Track your business performance month by month:

- **Revenue**: Total sales for each month
- **Ad Spend**: Total advertising costs for each month
- **Profit**: Net profit for each month
- **Margin**: Profit margin percentage
- **ROAS**: Return on ad spend for each month
- **Sales**: Number of course purchases

Color-coded indicators:
- 🟢 Green: Healthy profit margins (20%+)
- 🟡 Yellow: Moderate margins (10-20%)
- 🔴 Red: Low margins (<10%)

## Database Setup

### Run the Migration
To enable ad campaign tracking, run the SQL migration:

```sql
-- Run this in your MySQL database
source migrations/add_ad_campaigns.sql
```

Or manually execute:

```sql
CREATE TABLE IF NOT EXISTS `ad_campaigns` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `campaign_name` VARCHAR(255) NOT NULL,
  `spend_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `start_date` DATE NOT NULL,
  `end_date` DATE DEFAULT NULL,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_start_date` (`start_date`),
  INDEX `idx_end_date` (`end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

## API Endpoints

### Ad Campaigns

#### Get All Campaigns
```
GET /admin/api/ad-campaigns
```

#### Add New Campaign
```
POST /admin/api/ad-campaigns
Body: {
  "name": "Campaign Name",
  "spend": 5000,
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "notes": "Optional notes"
}
```

#### Update Campaign
```
PUT /admin/api/ad-campaigns/:id
Body: {
  "name": "Updated Name",
  "spend": 6000,
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "notes": "Updated notes"
}
```

#### Delete Campaign
```
DELETE /admin/api/ad-campaigns/:id
```

#### Get Total Ad Spend
```
GET /admin/api/ad-campaigns/total-spend
```

#### Get Monthly Breakdown
```
GET /admin/api/ad-campaigns/monthly-breakdown
```

## Files Modified/Added

### New Files:
- `public/admin-profit.js` - Profit tracking and ad campaign management logic
- `migrations/add_ad_campaigns.sql` - Database migration for ad campaigns table

### Modified Files:
- `views/admin.hbs` - Enhanced dashboard with profit tracking UI
- `routes/admin.js` - Added API endpoints for ad campaign management

## Usage Tips

### Tracking Facebook Ads
1. **Record Each Campaign**: When you start a new Facebook ad campaign, add it to the system
2. **Update Regularly**: If you increase your ad spend, edit the campaign to reflect the new amount
3. **Monitor ROAS**: Keep an eye on your Return on Ad Spend - aim for at least 2x (meaning you earn $2 for every $1 spent)
4. **Check Profit Margin**: Healthy e-learning businesses typically have 30-50% profit margins

### Best Practices
- **Track all ad spending**: Include all Facebook ad campaigns, even small tests
- **Review monthly**: Check the Monthly Performance Overview regularly
- **Set goals**: Aim to improve your ROAS and profit margin over time
- **Compare periods**: Use the monthly data to see trends and seasonal patterns

## Calculating Profitability

### Key Metrics Explained:

**ROAS (Return on Ad Spend)**
- Formula: Revenue ÷ Ad Spend
- Example: 10,000 DA revenue ÷ 2,000 DA ad spend = 5x ROAS
- Good ROAS: 3x or higher
- Excellent ROAS: 5x or higher

**Profit Margin**
- Formula: (Net Profit ÷ Revenue) × 100
- Example: (8,000 DA profit ÷ 10,000 DA revenue) × 100 = 80%
- Good Margin: 30%+
- Excellent Margin: 50%+

**Net Profit**
- Formula: Total Revenue - Total Ad Spend
- This is your actual profit after advertising costs
- Note: This doesn't include other costs like platform fees, content creation, etc.

## Troubleshooting

### Campaigns Not Showing
1. Make sure you've run the database migration
2. Check browser console for errors
3. Verify the database connection is working

### Profit Calculations Seem Wrong
1. Ensure all ad campaigns are recorded
2. Check that purchase data is accurate
3. Verify date ranges are correct

### Can't Add Campaign
1. Make sure all required fields are filled
2. Check that spend amount is not negative
3. Ensure start date is valid

## Future Enhancements

Potential features to add:
- Export profit reports to Excel/CSV
- Set profit goals and track progress
- Email alerts for low ROAS
- Integration with Facebook Ads API for automatic tracking
- Cost tracking beyond just ads (hosting, tools, etc.)
- Customer Acquisition Cost (CAC) calculations
- Lifetime Value (LTV) tracking

## Support

For questions or issues, please check:
1. This README file
2. The database migration file
3. Browser console for error messages
4. Server logs for API errors

---

**Remember**: Tracking your profit is essential for business growth. Use these tools daily to make data-driven decisions about your advertising and pricing strategy!
