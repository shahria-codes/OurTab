'use client';

import * as React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Box,
    Avatar,
    Chip,
    Paper,
    List,
    ListItem,
    ListItemText,
    Divider,
    Button
} from '@mui/material';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import GroupIcon from '@mui/icons-material/Group';
import { Expense } from '@/hooks/useHouseData';
import { formatDateLocale, formatTimeLocale } from '@/utils/date';

interface ExpenseDetailDialogProps {
    open: boolean;
    onClose: () => void;
    expense: Expense | null;
    allMembers: any[];
    displayCurrency: string;
}

export default function ExpenseDetailDialog({
    open,
    onClose,
    expense,
    allMembers,
    displayCurrency
}: ExpenseDetailDialogProps) {
    if (!expense) return null;

    const desc = expense.description;
    let itemsMatch = desc.match(/\(Items: (.*)\)$/);
    let noteMatch = desc.match(/^(.*) \(Items:/);

    let note = noteMatch ? noteMatch[1].trim() : (itemsMatch ? '' : desc);
    let itemsStr = itemsMatch ? itemsMatch[1] : (desc.includes('Items:') ? desc.split('Items:')[1].trim() : '');

    const isPrice = (str: string) => {
        if (str.includes('৳') || str.includes('$') || str.includes('€')) return true;
        const num = str.replace(/[^0-9.]/g, '');
        return num !== '' && !isNaN(Number(num));
    };

    let isSinglePriceItem = false;
    if (!itemsStr && !desc.includes('Items:')) {
        const lastSpaceIdx = desc.lastIndexOf(' ');
        if (lastSpaceIdx !== -1) {
            const potentialPrice = desc.substring(lastSpaceIdx + 1);
            if (isPrice(potentialPrice)) {
                isSinglePriceItem = true;
            }
        }
    }

    let isItemsList = !itemsStr && (desc.includes(',') || isSinglePriceItem) && (desc.includes('৳') || desc.includes('€') || desc.includes('$'));
    if (isItemsList) {
        itemsStr = desc;
        note = '';
    }

    const rawParts = itemsStr ? itemsStr.split(', ') : [];
    const mergedParts = [];
    let currentPart = '';

    for (const part of rawParts) {
        if (currentPart) {
            currentPart += ', ' + part;
        } else {
            currentPart = part;
        }

        const lastSpaceIdx = currentPart.lastIndexOf(' ');
        if (lastSpaceIdx !== -1) {
            const potentialPrice = currentPart.substring(lastSpaceIdx + 1);
            if (isPrice(potentialPrice)) {
                mergedParts.push(currentPart);
                currentPart = '';
                continue;
            }
        }
    }
    if (currentPart) {
        mergedParts.push(currentPart);
    }

    const itemsList = mergedParts.map(item => {
        const parts = item.split(/\s(?=[^ ]*$)/);
        if (parts.length === 2 && isPrice(parts[1])) {
            return { name: parts[0], price: parts[1] };
        }
        return { name: item, price: '' };
    }).filter(it => it.name.trim() !== '');

    const member = allMembers.find(m => m.email === expense.userId);
    const expenseDate = new Date(expense.date);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="sm"
            PaperProps={{
                className: 'glass',
                sx: {
                    borderRadius: 4,
                    backgroundImage: 'none',
                }
            }}
        >
            <DialogTitle component="div" sx={{ pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 800, background: 'linear-gradient(45deg, #6C63FF 30%, #FF6584 90%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Expense Details
                </Typography>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar src={member?.photoUrl} alt={member?.name || 'Member'} sx={{ width: 50, height: 50, border: '2px solid rgba(108, 99, 255, 0.2)' }} />
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                {member?.name || expense.userId.split('@')[0]}
                            </Typography>
                            <Typography variant="caption" color="text.primary" sx={{ opacity: 0.8 }}>
                                {formatDateLocale(expenseDate)}, {formatTimeLocale(expenseDate)}
                            </Typography>
                        </Box>
                        <Box sx={{ ml: 'auto', textAlign: 'right' }}>
                            <Typography variant="h4" color="primary" sx={{ fontWeight: 900 }}>
                                {displayCurrency}{expense.amount.toFixed(2)}
                            </Typography>
                            <Chip
                                label={expense.category || 'Expense'}
                                size="small"
                                sx={{
                                    mt: 0.5,
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    fontSize: '0.65rem',
                                    bgcolor: 'rgba(108, 99, 255, 0.1)',
                                    color: 'primary.main'
                                }}
                            />
                        </Box>
                    </Box>

                    {note && (
                        <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 2, borderLeft: '4px solid #6C63FF' }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                Note: {note}
                            </Typography>
                        </Box>
                    )}

                    {itemsList.length > 0 && (
                        <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <FormatListBulletedIcon sx={{ fontSize: 18, color: 'primary.main' }} /> Items List
                            </Typography>
                            <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)' }}>
                                <List disablePadding>
                                    {itemsList.map((item, idx) => (
                                        <Box key={idx}>
                                            <ListItem sx={{ py: 1.2 }}>
                                                <ListItemText
                                                    primary={item.name}
                                                    primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                                                />
                                                <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                                    {item.price}
                                                </Typography>
                                            </ListItem>
                                            {idx < itemsList.length - 1 && <Divider sx={{ opacity: 0.5 }} />}
                                        </Box>
                                    ))}
                                </List>
                            </Paper>
                        </Box>
                    )}

                    {expense.contributors && (expense.contributors.length > 1 || (expense.contributors.length === 1 && expense.contributors[0].email !== expense.userId)) && (
                        <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <GroupIcon sx={{ fontSize: 18, color: 'secondary.main' }} /> Split Details
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {expense.contributors.map((contrib, idx) => {
                                    const cMember = allMembers.find(m => m.email === contrib.email);
                                    return (
                                        <Chip
                                            key={idx}
                                            avatar={<Avatar src={cMember?.photoUrl} alt={cMember?.name || 'Member'} />}
                                            label={`${cMember?.name || contrib.email.split('@')[0]}: ${displayCurrency}${contrib.amount.toFixed(2)}`}
                                            variant="outlined"
                                            sx={{ borderRadius: 2, fontWeight: 600, color: 'text.primary' }}
                                        />
                                    );
                                })}
                            </Box>
                        </Box>
                    )}
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 0 }}>
                <Button
                    fullWidth
                    variant="outlined"
                    onClick={onClose}
                    sx={{ borderRadius: 3, py: 1, fontWeight: 700, textTransform: 'none' }}
                >
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}
