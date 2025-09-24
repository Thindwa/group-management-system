import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { useGroupStore } from '../../stores/groupStore';
import { useContributionStore } from '../../stores/contributionStore';
import { useBenefitStore } from '../../stores/benefitStore';
import { useLoanStore } from '../../stores/loanStore';
import { useLedgerStore } from '../../stores/ledgerStore';

export default function ReportsScreen() {
  const { currentGroup, currentCircle, groupSettings, members } = useGroupStore();
  const { contributions } = useContributionStore();
  const { benefits } = useBenefitStore();
  const { loans } = useLoanStore();
  const { entries, balance } = useLedgerStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const formatCurrency = (amount: number) => {
    return `MK ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const generateContributionsReport = () => {
    // Only include CONFIRMED contributions for accurate calculations
    const confirmedContributions = contributions.filter(c => c.status === 'CONFIRMED');
    const totalContributions = confirmedContributions.reduce((sum, c) => sum + c.amount, 0);
    const contributionsByMember = members.map(member => {
      const memberContribs = confirmedContributions.filter(c => c.member_id === member.id);
      const totalPaid = memberContribs.reduce((sum, c) => sum + c.amount, 0);
      const expectedAmount = groupSettings?.contribution_amount_default || 0;
      const periodsPaid = new Set(memberContribs.map(c => c.period_index)).size;
      const totalPeriods = groupSettings?.installments_per_circle || 0;
      
      return {
        name: member.full_name,
        phone: member.phone,
        totalPaid,
        periodsPaid,
        totalPeriods,
        expectedAmount: expectedAmount * totalPeriods,
        completionRate: totalPeriods > 0 ? (periodsPaid / totalPeriods) * 100 : 0,
      };
    });

    return {
      title: 'Contributions Report',
      groupName: currentGroup?.name || 'Unknown Group',
      circleYear: currentCircle?.year || 'Unknown Circle',
      reportDate: new Date().toLocaleDateString('en-GB'),
      summary: {
        totalContributions,
        totalMembers: members.length,
        averageContribution: members.length > 0 ? totalContributions / members.length : 0,
      },
      members: contributionsByMember,
    };
  };

  const generateBenefitsReport = () => {
    const totalBenefits = benefits.reduce((sum, b) => sum + b.requested_amount, 0);
    const benefitsByType = {
      funeral: benefits.filter(b => b.type === 'FUNERAL'),
      sickness: benefits.filter(b => b.type === 'SICKNESS'),
    };
    
    const benefitsByStatus = {
      pending: benefits.filter(b => b.status === 'PENDING').length,
      approved: benefits.filter(b => b.status === 'APPROVED').length,
      rejected: benefits.filter(b => b.status === 'REJECTED').length,
      waitlisted: benefits.filter(b => b.status === 'WAITLISTED').length,
      paid: benefits.filter(b => b.status === 'PAID').length,
    };

    return {
      title: 'Benefits Report',
      groupName: currentGroup?.name || 'Unknown Group',
      circleYear: currentCircle?.year || 'Unknown Circle',
      reportDate: new Date().toLocaleDateString('en-GB'),
      summary: {
        totalBenefits,
        totalRequests: benefits.length,
        averageBenefit: benefits.length > 0 ? totalBenefits / benefits.length : 0,
      },
      byType: {
        funeral: {
          count: benefitsByType.funeral.length,
          amount: benefitsByType.funeral.reduce((sum, b) => sum + b.requested_amount, 0),
        },
        sickness: {
          count: benefitsByType.sickness.length,
          amount: benefitsByType.sickness.reduce((sum, b) => sum + b.requested_amount, 0),
        },
      },
      byStatus: benefitsByStatus,
    };
  };

  const generateLoansReport = () => {
    const totalPrincipal = loans.reduce((sum, l) => sum + l.principal, 0);
    const loansByStatus = {
      waitlisted: loans.filter(l => l.status === 'WAITLISTED').length,
      active: loans.filter(l => l.status === 'ACTIVE').length,
      closed: loans.filter(l => l.status === 'CLOSED').length,
    };

    // Calculate detailed loan statistics
    const activeLoans = loans.filter(l => l.status === 'ACTIVE');
    const closedLoans = loans.filter(l => l.status === 'CLOSED');
    
    let totalInterestEarned = 0;
    let totalInterestOutstanding = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;
    
    // Calculate interest for active loans
    activeLoans.forEach(loan => {
      if (loan.disbursed_at && groupSettings) {
        const loanTotals = useLoanStore.getState().calculateLoanTotals(loan, groupSettings);
        if (loanTotals) {
          const interestAmount = loanTotals.grossDue - loan.principal;
          totalInterestOutstanding += interestAmount;
          totalOutstanding += loanTotals.outstanding;
          totalPaid += loanTotals.paid;
          console.log(`Active loan ${loan.id}: Principal ${loan.principal}, Interest ${interestAmount}, Gross Due ${loanTotals.grossDue}`);
        }
      }
    });
    
    // Calculate interest for closed loans (fully repaid)
    closedLoans.forEach(loan => {
      if (loan.disbursed_at && groupSettings) {
        const loanTotals = useLoanStore.getState().calculateLoanTotals(loan, groupSettings);
        if (loanTotals) {
          const interestAmount = loanTotals.grossDue - loan.principal;
          totalInterestEarned += interestAmount;
          totalPaid += loanTotals.paid;
          console.log(`Closed loan ${loan.id}: Principal ${loan.principal}, Interest ${interestAmount}, Gross Due ${loanTotals.grossDue}`);
        }
      }
    });

    return {
      title: 'Loans Report',
      groupName: currentGroup?.name || 'Unknown Group',
      circleYear: currentCircle?.year || 'Unknown Circle',
      reportDate: new Date().toLocaleDateString('en-GB'),
      summary: {
        totalPrincipal,
        totalInterestEarned,
        totalInterestOutstanding,
        totalPaid,
        totalOutstanding,
        totalRequests: loans.length,
        averageLoan: loans.length > 0 ? totalPrincipal / loans.length : 0,
        activeLoans: activeLoans.length,
        closedLoans: closedLoans.length,
        interestRate: groupSettings?.loan_interest_percent || 0,
        loanPeriodDays: groupSettings?.loan_period_days || 0,
      },
      byStatus: loansByStatus,
    };
  };

  const generateCircleSummaryReport = () => {
    // Only include CONFIRMED contributions for accurate balance
    const confirmedContributions = contributions.filter(c => c.status === 'CONFIRMED');
    const totalContributions = confirmedContributions.reduce((sum, c) => sum + c.amount, 0);
    
    // Benefits breakdown
    const totalBenefits = benefits.reduce((sum, b) => sum + b.requested_amount, 0);
    const paidBenefits = benefits.filter(b => b.status === 'PAID');
    const totalBenefitsPaid = paidBenefits.reduce((sum, b) => sum + b.requested_amount, 0);
    const pendingBenefits = benefits.filter(b => b.status === 'PENDING' || b.status === 'APPROVED');
    const totalBenefitsPending = pendingBenefits.reduce((sum, b) => sum + b.requested_amount, 0);
    
    // Loans breakdown
    const totalLoans = loans.reduce((sum, l) => sum + l.principal, 0);
    const activeLoans = loans.filter(l => l.status === 'ACTIVE');
    const closedLoans = loans.filter(l => l.status === 'CLOSED');
    const waitlistedLoans = loans.filter(l => l.status === 'WAITLISTED');
    
    // Calculate interest earned from loans
    let totalInterestEarned = 0;
    let totalInterestOutstanding = 0;
    let totalLoanPayments = 0;
    let totalLoanOutstanding = 0;
    
    // Calculate interest for active loans
    activeLoans.forEach(loan => {
      if (loan.disbursed_at && groupSettings) {
        const loanTotals = useLoanStore.getState().calculateLoanTotals(loan, groupSettings);
        if (loanTotals) {
          const interestAmount = loanTotals.grossDue - loan.principal;
          totalInterestOutstanding += interestAmount;
          totalLoanPayments += loanTotals.paid;
          totalLoanOutstanding += loanTotals.outstanding;
        }
      }
    });
    
    // Calculate interest for closed loans (fully repaid)
    closedLoans.forEach(loan => {
      if (loan.disbursed_at && groupSettings) {
        const loanTotals = useLoanStore.getState().calculateLoanTotals(loan, groupSettings);
        if (loanTotals) {
          const interestAmount = loanTotals.grossDue - loan.principal;
          totalInterestEarned += interestAmount;
          totalLoanPayments += loanTotals.paid;
        }
      }
    });

    // Member contribution statistics
    const contributionsByMember = members.map(member => {
      const memberContribs = confirmedContributions.filter(c => c.member_id === member.id);
      const totalPaid = memberContribs.reduce((sum, c) => sum + c.amount, 0);
      const expectedAmount = groupSettings?.contribution_amount_default || 0;
      const periodsPaid = new Set(memberContribs.map(c => c.period_index)).size;
      const totalPeriods = groupSettings?.installments_per_circle || 0;
      
      return {
        name: member.full_name,
        totalPaid,
        periodsPaid,
        totalPeriods,
        expectedAmount: expectedAmount * totalPeriods,
        completionRate: totalPeriods > 0 ? (periodsPaid / totalPeriods) * 100 : 0,
        arrears: Math.max(0, (expectedAmount * totalPeriods) - totalPaid),
        status: totalPeriods > 0 && periodsPaid >= totalPeriods ? 'Complete' : 
                totalPeriods > 0 && periodsPaid > 0 ? 'Partial' : 'Not Started'
      };
    });

    // Financial summary
    const netBalance = (balance?.available || 0) - (balance?.reserve || 0);
    const totalIncome = totalContributions + totalInterestEarned;
    const totalExpenses = totalBenefitsPaid + totalLoanOutstanding;
    const netProfit = totalIncome - totalExpenses;

    return {
      title: 'Comprehensive Circle Summary Report',
      groupName: currentGroup?.name || 'Unknown Group',
      circleYear: currentCircle?.year || 'Unknown Circle',
      reportDate: new Date().toLocaleDateString('en-GB'),
      sections: {
        // Income Section
        income: {
          title: '💰 Income Summary',
          items: [
            { label: 'Total Contributions', value: totalContributions, type: 'currency' },
            { label: 'Interest Earned (Closed Loans)', value: totalInterestEarned, type: 'currency' },
            { label: 'Interest Outstanding (Active Loans)', value: totalInterestOutstanding, type: 'currency' },
            { label: 'Total Income', value: totalIncome, type: 'currency', highlight: true }
          ]
        },
        
        // Expenses Section
        expenses: {
          title: '💸 Expenses Summary',
          items: [
            { label: 'Benefits Paid', value: totalBenefitsPaid, type: 'currency' },
            { label: 'Benefits Pending', value: totalBenefitsPending, type: 'currency' },
            { label: 'Loan Principal Outstanding', value: totalLoanOutstanding, type: 'currency' },
            { label: 'Total Expenses', value: totalExpenses, type: 'currency', highlight: true }
          ]
        },
        
        // Loans Section
        loans: {
          title: '🏦 Loan Portfolio',
          items: [
            { label: 'Total Loan Principal', value: totalLoans, type: 'currency' },
            { label: 'Active Loans', value: activeLoans.length, type: 'count' },
            { label: 'Closed Loans', value: closedLoans.length, type: 'count' },
            { label: 'Waitlisted Loans', value: waitlistedLoans.length, type: 'count' },
            { label: 'Total Loan Payments Received', value: totalLoanPayments, type: 'currency' },
            { label: 'Average Loan Size', value: loans.length > 0 ? totalLoans / loans.length : 0, type: 'currency' }
          ]
        },
        
        // Benefits Section
        benefits: {
          title: '🎁 Benefits Summary',
          items: [
            { label: 'Total Benefits Requested', value: totalBenefits, type: 'currency' },
            { label: 'Benefits Paid', value: paidBenefits.length, type: 'count' },
            { label: 'Benefits Pending', value: pendingBenefits.length, type: 'count' },
            { label: 'Average Benefit Amount', value: benefits.length > 0 ? totalBenefits / benefits.length : 0, type: 'currency' }
          ]
        },
        
        // Financial Health Section
        financialHealth: {
          title: '📊 Financial Health',
          items: [
            { label: 'Current Balance', value: balance?.available || 0, type: 'currency' },
            { label: 'Reserve Balance', value: balance?.reserve || 0, type: 'currency' },
            { label: 'Net Available Balance', value: netBalance, type: 'currency' },
            { label: 'Net Profit/Loss', value: netProfit, type: 'currency', highlight: true },
            { label: 'Total Members', value: members.length, type: 'count' },
            { label: 'Profit Margin', value: totalIncome > 0 ? ((netProfit / totalIncome) * 100) : 0, type: 'percentage' }
          ]
        }
      },
      members: contributionsByMember,
      settings: groupSettings
    };
  };

  const generatePDF = async (reportData: any) => {
    const formatValue = (value: any, type: string) => {
      switch (type) {
        case 'currency':
          return formatCurrency(value);
        case 'percentage':
          return `${value.toFixed(1)}%`;
        case 'count':
          return value.toString();
        default:
          return typeof value === 'number' ? formatCurrency(value) : value;
      }
    };

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${reportData.title}</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 0; 
              padding: 20px; 
              background-color: #f8f9fa; 
              color: #333;
              line-height: 1.6;
            }
            .container { 
              max-width: 1200px; 
              margin: 0 auto; 
              background: white; 
              padding: 30px; 
              border-radius: 12px; 
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .header { 
              text-align: center; 
              margin-bottom: 40px; 
              padding-bottom: 20px;
              border-bottom: 3px solid #007bff;
            }
            .title { 
              font-size: 28px; 
              font-weight: bold; 
              color: #2c3e50; 
              margin-bottom: 10px;
            }
            .subtitle { 
              font-size: 18px; 
              color: #6c757d; 
              margin: 5px 0;
            }
            .report-date {
              font-size: 14px;
              color: #868e96;
              margin-top: 10px;
            }
            .sections-container {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              margin-bottom: 40px;
            }
            .section { 
              background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
              padding: 25px; 
              border-radius: 12px; 
              border-left: 5px solid #007bff;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .section-title { 
              font-size: 20px; 
              font-weight: bold; 
              color: #2c3e50; 
              margin-bottom: 20px;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .section-item { 
              display: flex; 
              justify-content: space-between; 
              align-items: center;
              margin-bottom: 15px; 
              padding: 12px;
              background: white;
              border-radius: 8px;
              border: 1px solid #e9ecef;
              transition: all 0.2s ease;
            }
            .section-item:hover {
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              transform: translateY(-1px);
            }
            .section-item.highlight {
              background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
              color: white;
              font-weight: bold;
              border: none;
            }
            .item-label { 
              font-weight: 500; 
              color: inherit;
            }
            .item-value { 
              font-weight: 600;
              color: inherit;
            }
            .table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 30px 0;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .table th, .table td { 
              padding: 15px; 
              text-align: left; 
              border-bottom: 1px solid #e9ecef;
            }
            .table th { 
              background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
              color: white; 
              font-weight: bold; 
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .table tbody tr { 
              transition: background-color 0.2s ease;
            }
            .table tbody tr:hover { 
              background-color: #f8f9fa; 
            }
            .table tbody tr:nth-child(even) { 
              background-color: #f8f9fa; 
            }
            .status-badge {
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .status-complete { background: #d4edda; color: #155724; }
            .status-partial { background: #fff3cd; color: #856404; }
            .status-not-started { background: #f8d7da; color: #721c24; }
            .footer { 
              text-align: center; 
              margin-top: 50px; 
              padding-top: 20px;
              border-top: 2px solid #e9ecef;
              color: #6c757d; 
              font-size: 14px;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 20px;
              margin: 30px 0;
            }
            .summary-card {
              background: white;
              padding: 20px;
              border-radius: 12px;
              text-align: center;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              border-top: 4px solid #007bff;
            }
            .summary-card-value {
              font-size: 24px;
              font-weight: bold;
              color: #007bff;
              margin-bottom: 5px;
            }
            .summary-card-label {
              font-size: 14px;
              color: #6c757d;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            @media print {
              body { background: white; }
              .container { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="title">${reportData.title}</div>
              <div class="subtitle">${reportData.groupName}</div>
              <div class="subtitle">Circle Year: ${reportData.circleYear}</div>
              <div class="report-date">Generated on ${reportData.reportDate}</div>
            </div>
            
            ${reportData.sections ? `
              <div class="sections-container">
                ${Object.values(reportData.sections).map((section: any) => `
                  <div class="section">
                    <div class="section-title">${section.title}</div>
                    ${section.items.map((item: any) => `
                      <div class="section-item ${item.highlight ? 'highlight' : ''}">
                        <span class="item-label">${item.label}</span>
                        <span class="item-value">${formatValue(item.value, item.type)}</span>
                      </div>
                    `).join('')}
                  </div>
                `).join('')}
              </div>
            ` : ''}
            
            ${reportData.members ? `
              <h3 style="color: #2c3e50; margin: 40px 0 20px 0; font-size: 24px;">👥 Member Contributions Summary</h3>
              <table class="table">
                <thead>
                  <tr>
                    <th>Member Name</th>
                    <th>Status</th>
                    <th>Total Paid</th>
                    <th>Periods Paid</th>
                    <th>Expected Amount</th>
                    <th>Arrears</th>
                    <th>Completion Rate</th>
                  </tr>
                </thead>
                <tbody>
                  ${reportData.members.map((member: any) => `
                    <tr>
                      <td><strong>${member.name}</strong></td>
                      <td>
                        <span class="status-badge status-${member.status.toLowerCase().replace(' ', '-')}">
                          ${member.status}
                        </span>
                      </td>
                      <td>${formatCurrency(member.totalPaid)}</td>
                      <td>${member.periodsPaid}/${member.totalPeriods}</td>
                      <td>${formatCurrency(member.expectedAmount)}</td>
                      <td>${formatCurrency(member.arrears)}</td>
                      <td>${member.completionRate.toFixed(1)}%</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : ''}
            
            ${reportData.settings ? `
              <h3 style="color: #2c3e50; margin: 40px 0 20px 0; font-size: 24px;">⚙️ Group Settings</h3>
              <div class="summary-grid">
                ${Object.entries(reportData.settings).filter(([key]) => 
                  ['contribution_amount_default', 'installments_per_circle', 'loan_interest_percent', 
                   'loan_period_days', 'funeral_benefit', 'sickness_benefit'].includes(key)
                ).map(([key, value]) => {
                  const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                  const displayValue = typeof value === 'number' ? 
                    (key.includes('percent') ? `${value}%` : formatCurrency(value)) : value;
                  return `
                    <div class="summary-card">
                      <div class="summary-card-value">${displayValue}</div>
                      <div class="summary-card-label">${label}</div>
                    </div>
                  `;
                }).join('')}
              </div>
            ` : ''}
            
            <div class="footer">
              <p><strong>Generated by Group Management System</strong></p>
              <p>This report provides a comprehensive overview of your group's financial activities and member contributions.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return html;
  };

  const handleGenerateReport = async (reportType: string) => {
    console.log('Generating report with type:', reportType);
    setIsGenerating(true);
    try {
      let reportData;
      
      switch (reportType) {
        case 'contributions':
          reportData = generateContributionsReport();
          break;
        case 'benefits':
          reportData = generateBenefitsReport();
          break;
        case 'loans':
          reportData = generateLoansReport();
          break;
        case 'circle-summary':
          reportData = generateCircleSummaryReport();
          break;
        default:
          console.error('Invalid report type:', reportType);
          console.log('Available report types: contributions, benefits, loans, circle-summary');
          throw new Error(`Invalid report type: ${reportType}`);
      }

      const html = await generatePDF(reportData);
      
      // Generate filename with group name and circle
      const sanitizeFilename = (str: string) => str.replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/\s+/g, '_');
      const groupName = sanitizeFilename(reportData.groupName || 'Group');
      const circleYear = reportData.circleYear || 'Unknown';
      const reportTypeName = sanitizeFilename(reportData.title || 'Report');
      const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      const filename = `${groupName}_${circleYear}_${reportTypeName}_${timestamp}.pdf`;
      
      console.log('Generating PDF with filename:', filename);
      
      const { uri } = await Print.printToFileAsync({ 
        html,
        base64: false
      });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `${reportData.title} - ${reportData.groupName}`,
          UTI: 'com.adobe.pdf'
        });
      } else {
        Alert.alert('Success', `PDF generated successfully: ${filename}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF report');
      console.error('PDF generation error:', error);
    } finally {
      setIsGenerating(false);
      setShowReportModal(false);
      setSelectedReport(null);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh all data stores
      if (currentGroup && currentCircle) {
        const { loadContributions } = useContributionStore.getState();
        const { loadBenefits } = useBenefitStore.getState();
        const { loadLoans } = useLoanStore.getState();
        const { loadLedgerEntries, loadBalance } = useLedgerStore.getState();
        const { loadMembers } = useGroupStore.getState();

        // Load all data in parallel
        await Promise.all([
          loadContributions(currentGroup.id, currentCircle.id),
          loadBenefits(currentGroup.id, currentCircle.id),
          loadLoans(currentGroup.id, currentCircle.id),
          loadLedgerEntries(currentGroup.id, currentCircle.id),
          loadBalance(currentGroup.id, currentCircle.id),
          loadMembers(currentGroup.id),
        ]);
      }
    } catch (error) {
      console.error('Error refreshing reports data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (!currentGroup || !currentCircle) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>No group or circle data available</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Reports</Text>
        <Text style={styles.subtitle}>
          {currentGroup.name} - {currentCircle.year}
        </Text>
      </View>

      {/* Report Cards */}
      <View style={styles.reportsContainer}>
        <TouchableOpacity
          style={styles.reportCard}
          onPress={() => {
            setSelectedReport('contributions');
            setShowReportModal(true);
          }}
        >
          <View style={styles.reportCardHeader}>
            <Text style={styles.reportIcon}>📊</Text>
            <Text style={styles.reportTitle}>Contributions Report</Text>
          </View>
          <Text style={styles.reportDescription}>
            Member contribution summary and statistics
          </Text>
          <View style={styles.reportStatsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{contributions.filter(c => c.status === 'CONFIRMED').length}</Text>
              <Text style={styles.statLabel}>Confirmed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatCurrency(contributions.filter(c => c.status === 'CONFIRMED').reduce((sum, c) => sum + c.amount, 0))}</Text>
              <Text style={styles.statLabel}>Total Amount</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.reportCard}
          onPress={() => {
            setSelectedReport('benefits');
            setShowReportModal(true);
          }}
        >
          <View style={styles.reportCardHeader}>
            <Text style={styles.reportIcon}>🎁</Text>
            <Text style={styles.reportTitle}>Benefits Report</Text>
          </View>
          <Text style={styles.reportDescription}>
            Benefit requests and payment summary
          </Text>
          <View style={styles.reportStatsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{benefits.length}</Text>
              <Text style={styles.statLabel}>Total Requests</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatCurrency(benefits.reduce((sum, b) => sum + b.requested_amount, 0))}</Text>
              <Text style={styles.statLabel}>Total Amount</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.reportCard}
          onPress={() => {
            setSelectedReport('loans');
            setShowReportModal(true);
          }}
        >
          <View style={styles.reportCardHeader}>
            <Text style={styles.reportIcon}>💰</Text>
            <Text style={styles.reportTitle}>Loans Report</Text>
          </View>
          <Text style={styles.reportDescription}>
            Loan requests, repayments, and interest earned
          </Text>
          <View style={styles.reportStatsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{loans.length}</Text>
              <Text style={styles.statLabel}>Total Loans</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatCurrency(loans.reduce((sum, l) => sum + l.principal, 0))}</Text>
              <Text style={styles.statLabel}>Total Principal</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.reportCard}
          onPress={() => {
            setSelectedReport('circle-summary');
            setShowReportModal(true);
          }}
        >
          <View style={styles.reportCardHeader}>
            <Text style={styles.reportIcon}>📈</Text>
            <Text style={styles.reportTitle}>Comprehensive Circle Summary</Text>
          </View>
          <Text style={styles.reportDescription}>
            Complete financial overview with all income, expenses, loans, benefits, and member statistics
          </Text>
          <View style={styles.reportStatsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{members.length}</Text>
              <Text style={styles.statLabel}>Members</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatCurrency(balance?.available || 0)}</Text>
              <Text style={styles.statLabel}>Available Balance</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Report Modal */}
      <Modal visible={showReportModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Generate Report</Text>
            <TouchableOpacity onPress={() => {
              setShowReportModal(false);
              setSelectedReport(null);
            }}>
              <Text style={styles.modalCloseButton}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.modalDescription}>
              This will generate a PDF report with the latest data. The report will be saved to your device and can be shared.
            </Text>

            <TouchableOpacity
              style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
              onPress={() => {
                console.log('Selected report:', selectedReport);
                if (selectedReport) {
                  handleGenerateReport(selectedReport);
                } else {
                  Alert.alert('Error', 'No report type selected');
                }
              }}
              disabled={isGenerating}
            >
              <Text style={styles.generateButtonText}>
                {isGenerating ? 'Generating PDF...' : 'Generate PDF Report'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  reportsContainer: {
    padding: 16,
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  reportCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  reportTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  reportDescription: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 22,
  },
  reportStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007BFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6C757D',
    textAlign: 'center',
    fontWeight: '500',
  },
  reportStats: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalCloseButton: {
    fontSize: 16,
    color: '#3B82F6',
  },
  modalContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  modalDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  generateButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  generateButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  noDataText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#6B7280',
  },
});