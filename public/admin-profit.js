// ============================================
// PROFIT TRACKING & FACEBOOK ADS MANAGEMENT
// ============================================

// Store ad campaigns data
let adCampaigns = [];

// Load Dashboard Stats with Profit Calculations
async function loadDashboardStats() {
    try {
        // Load basic stats
        const response = await fetch('/admin/api/stats');
        const result = await response.json();

        if (result.success) {
            const stats = result.stats;

            // Update basic stats
            document.getElementById('totalUsers').textContent = stats.totalUsers || 0;
            document.getElementById('totalCourses').textContent = stats.totalCourses || 0;
            document.getElementById('totalPurchases').textContent = stats.totalPurchases || 0;

            // Use totalRevenue from stats
            const revenue = parseFloat(stats.totalRevenue) || 0;
            document.getElementById('totalEarnings').textContent = `${revenue.toFixed(2)} DA`;

            // Calculate profit metrics
            const totalAdSpend = await calculateTotalAdSpend();
            const netProfit = revenue - totalAdSpend;
            const profitMargin = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(2) : 0;
            const roas = totalAdSpend > 0 ? (revenue / totalAdSpend).toFixed(2) : 0;
            const avgOrderValue = stats.totalPurchases > 0 ? (revenue / stats.totalPurchases).toFixed(2) : 0;

            // Update profit cards
            document.getElementById('totalRevenue').textContent = `${revenue.toFixed(2)} DA`;
            document.getElementById('totalAdSpend').textContent = `${totalAdSpend.toFixed(2)} DA`;
            document.getElementById('netProfit').textContent = `${netProfit.toFixed(2)} DA`;
            document.getElementById('profitMargin').textContent = `${profitMargin}%`;
            document.getElementById('roas').textContent = `${roas}x`;
            document.getElementById('avgOrderValue').textContent = `${avgOrderValue} DA`;

            // Update calculator
            document.getElementById('calcRevenue').value = revenue.toFixed(2);
            document.getElementById('calcAdSpend').value = totalAdSpend.toFixed(2);
            document.getElementById('calcProfit').textContent = `${netProfit.toFixed(2)} DA`;
            document.getElementById('calcMargin').textContent = `${profitMargin}%`;

            // Load monthly performance
            loadMonthlyPerformance(stats);
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// Calculate total ad spend from database
async function calculateTotalAdSpend() {
    try {
        const response = await fetch('/admin/api/ad-campaigns/total-spend');
        const result = await response.json();
        if (result.success) {
            return parseFloat(result.totalSpend) || 0;
        }
    } catch (error) {
        console.error('Error calculating ad spend:', error);
    }
    return 0;
}

// Load and display ad campaigns from database
async function loadAdCampaigns() {
    try {
        const response = await fetch('/admin/api/ad-campaigns');
        const result = await response.json();

        if (!result.success) {
            console.error('Failed to load campaigns');
            return;
        }

        adCampaigns = result.campaigns || [];
        const tbody = document.getElementById('adCampaignsTableBody');

        if (!adCampaigns || adCampaigns.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No campaigns yet. Add one to track your ad spend.</td></tr>';
            return;
        }

        tbody.innerHTML = adCampaigns.map((campaign) => {
            const startDate = new Date(campaign.start_date).toLocaleDateString();
            const endDate = campaign.end_date ? new Date(campaign.end_date).toLocaleDateString() : 'Ongoing';
            const period = `${startDate} - ${endDate}`;

            return `
        <tr>
          <td>
            <strong>${campaign.campaign_name}</strong>
            ${campaign.notes ? `<br><small class="text-muted">${campaign.notes.substring(0, 50)}${campaign.notes.length > 50 ? '...' : ''}</small>` : ''}
          </td>
          <td><strong style="color: #ef4444;">${parseFloat(campaign.spend_amount).toFixed(2)} DA</strong></td>
          <td><small>${period}</small></td>
          <td>
            <button class="btn btn-sm btn-info" onclick="editAdCampaign(${campaign.id})" title="Edit">
              <span class="material-symbols-outlined" style="font-size: 16px;">edit</span>
            </button>
            <button class="btn btn-sm btn-danger" onclick="deleteAdCampaign(${campaign.id})" title="Delete">
              <span class="material-symbols-outlined" style="font-size: 16px;">delete</span>
            </button>
          </td>
        </tr>
      `;
        }).join('');
    } catch (error) {
        console.error('Error loading campaigns:', error);
    }
}

// Open add campaign modal
function openAddAdCampaignModal() {
    document.getElementById('addAdCampaignModalLabel').innerHTML = `
    <span class="material-symbols-outlined" style="vertical-align: middle;">campaign</span>
    Add Facebook Ad Campaign
  `;
    document.getElementById('addAdCampaignForm').reset();
    document.getElementById('editCampaignId').value = '';
    document.getElementById('messageAdCampaign').style.display = 'none';

    const modal = new bootstrap.Modal(document.getElementById('addAdCampaignModal'));
    modal.show();
}

// Edit ad campaign
async function editAdCampaign(campaignId) {
    const campaign = adCampaigns.find(c => c.id === campaignId);

    if (!campaign) {
        alert('Campaign not found');
        return;
    }

    document.getElementById('addAdCampaignModalLabel').innerHTML = `
    <span class="material-symbols-outlined" style="vertical-align: middle;">campaign</span>
    Edit Facebook Ad Campaign
  `;
    document.getElementById('editCampaignId').value = campaignId;
    document.getElementById('campaignName').value = campaign.campaign_name;
    document.getElementById('campaignSpend').value = campaign.spend_amount;
    document.getElementById('campaignStartDate').value = campaign.start_date;
    document.getElementById('campaignEndDate').value = campaign.end_date || '';
    document.getElementById('campaignNotes').value = campaign.notes || '';
    document.getElementById('messageAdCampaign').style.display = 'none';

    const modal = new bootstrap.Modal(document.getElementById('addAdCampaignModal'));
    modal.show();
}

// Delete ad campaign
async function deleteAdCampaign(campaignId) {
    if (!confirm('Are you sure you want to delete this ad campaign?')) return;

    try {
        const response = await fetch(`/admin/api/ad-campaigns/${campaignId}`, {
            method: 'DELETE'
        });
        const result = await response.json();

        if (result.success) {
            await loadAdCampaigns();
            await loadDashboardStats();
        } else {
            alert(result.message || 'Failed to delete campaign');
        }
    } catch (error) {
        console.error('Error deleting campaign:', error);
        alert('Error deleting campaign');
    }
}

// Setup ad campaign form submission
document.addEventListener('DOMContentLoaded', function () {
    const adCampaignForm = document.getElementById('addAdCampaignForm');
    if (adCampaignForm) {
        adCampaignForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const editId = document.getElementById('editCampaignId').value;
            const campaignName = document.getElementById('campaignName').value.trim();
            const campaignSpend = parseFloat(document.getElementById('campaignSpend').value);
            const campaignStartDate = document.getElementById('campaignStartDate').value;
            const campaignEndDate = document.getElementById('campaignEndDate').value;
            const campaignNotes = document.getElementById('campaignNotes').value.trim();
            const message = document.getElementById('messageAdCampaign');

            message.textContent = '';
            message.style.display = 'none';

            // Validation
            if (!campaignName || !campaignSpend || !campaignStartDate) {
                message.textContent = 'Please fill in all required fields.';
                message.style.display = 'block';
                message.className = 'alert alert-danger';
                return;
            }

            if (campaignSpend < 0) {
                message.textContent = 'Ad spend cannot be negative.';
                message.style.display = 'block';
                message.className = 'alert alert-danger';
                return;
            }

            const campaignData = {
                name: campaignName,
                spend: campaignSpend,
                startDate: campaignStartDate,
                endDate: campaignEndDate || null,
                notes: campaignNotes
            };

            try {
                let response;
                if (editId) {
                    // Update existing campaign
                    response = await fetch(`/admin/api/ad-campaigns/${editId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(campaignData)
                    });
                } else {
                    // Add new campaign
                    response = await fetch('/admin/api/ad-campaigns', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(campaignData)
                    });
                }

                const result = await response.json();

                if (result.success) {
                    message.textContent = result.message;
                    message.style.display = 'block';
                    message.className = 'alert alert-success';

                    setTimeout(async () => {
                        const modal = bootstrap.Modal.getInstance(document.getElementById('addAdCampaignModal'));
                        modal.hide();
                        await loadAdCampaigns();
                        await loadDashboardStats();
                    }, 1000);
                } else {
                    message.textContent = result.message || 'Failed to save campaign';
                    message.style.display = 'block';
                    message.className = 'alert alert-danger';
                }
            } catch (error) {
                console.error('Error saving campaign:', error);
                message.textContent = 'Error connecting to server';
                message.style.display = 'block';
                message.className = 'alert alert-danger';
            }
        });
    }

    // Load campaigns on page load
    loadAdCampaigns();
});

// Load monthly performance data
async function loadMonthlyPerformance(stats) {
    try {
        const response = await fetch('/admin/api/purchases');
        const result = await response.json();

        if (!result.success) {
            document.getElementById('monthlyPerformanceBody').innerHTML =
                '<tr><td colspan="7" class="text-center text-muted">No data available</td></tr>';
            return;
        }

        const purchases = result.purchases || [];

        // Group purchases by month
        const monthlyData = {};
        purchases.forEach(purchase => {
            const date = new Date(purchase.purchase_date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = {
                    revenue: 0,
                    sales: 0,
                    month: date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
                };
            }

            monthlyData[monthKey].revenue += parseFloat(purchase.price || 0);
            monthlyData[monthKey].sales += 1;
        });

        // Group ad campaigns by month
        const monthlyAdSpend = {};
        adCampaigns.forEach(campaign => {
            const date = new Date(campaign.start_date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!monthlyAdSpend[monthKey]) {
                monthlyAdSpend[monthKey] = 0;
            }
            monthlyAdSpend[monthKey] += parseFloat(campaign.spend_amount || 0);
        });

        // Combine data and sort by month (most recent first)
        const sortedMonths = Object.keys(monthlyData).sort().reverse().slice(0, 6);

        if (sortedMonths.length === 0) {
            document.getElementById('monthlyPerformanceBody').innerHTML =
                '<tr><td colspan="7" class="text-center text-muted">No monthly data available yet</td></tr>';
            return;
        }

        const tbody = document.getElementById('monthlyPerformanceBody');
        tbody.innerHTML = sortedMonths.map(monthKey => {
            const data = monthlyData[monthKey];
            const adSpend = monthlyAdSpend[monthKey] || 0;
            const profit = data.revenue - adSpend;
            const margin = data.revenue > 0 ? ((profit / data.revenue) * 100).toFixed(1) : 0;
            const roas = adSpend > 0 ? (data.revenue / adSpend).toFixed(2) : 'N/A';

            const profitColor = profit >= 0 ? '#10b981' : '#ef4444';
            const marginColor = margin >= 20 ? '#10b981' : margin >= 10 ? '#f59e0b' : '#ef4444';

            return `
        <tr>
          <td><strong>${data.month}</strong></td>
          <td><span style="color: #10b981; font-weight: 600;">${data.revenue.toFixed(2)} DA</span></td>
          <td><span style="color: #ef4444; font-weight: 600;">${adSpend.toFixed(2)} DA</span></td>
          <td><span style="color: ${profitColor}; font-weight: 600;">${profit.toFixed(2)} DA</span></td>
          <td><span style="color: ${marginColor}; font-weight: 600;">${margin}%</span></td>
          <td><strong>${roas}x</strong></td>
          <td><span class="badge badge-info">${data.sales} sales</span></td>
        </tr>
      `;
        }).join('');

    } catch (error) {
        console.error('Error loading monthly performance:', error);
        document.getElementById('monthlyPerformanceBody').innerHTML =
            '<tr><td colspan="7" class="text-center text-danger">Error loading data</td></tr>';
    }
}
