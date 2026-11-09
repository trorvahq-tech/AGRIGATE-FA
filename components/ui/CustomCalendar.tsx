import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface CustomCalendarProps {
    selectedDate?: string;
    onDateSelect: (date: string) => void;
}

const DAYS_OF_WEEK = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export default function CustomCalendar({ selectedDate, onDateSelect }: CustomCalendarProps) {
    const { colors, isDarkMode } = useTheme();
    const [currentDate, setCurrentDate] = useState(new Date());

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        return { daysInMonth, firstDayOfMonth };
    };

    const changeMonth = (increment: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + increment);
        setCurrentDate(newDate);
    };

    const formatDate = (day: number) => {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        return `${d}-${month}-${year}`;
    };

    const { daysInMonth, firstDayOfMonth } = getDaysInMonth(currentDate);
    const monthYearString = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    const renderCalendarGrid = () => {
        const grid = [];
        let dayCounter = 1;

        for (let row = 0; row < 6; row++) {
            const rowCells = [];
            for (let col = 0; col < 7; col++) {
                if (row === 0 && col < firstDayOfMonth) {
                    rowCells.push(<View key={`empty-${col}`} style={styles.dayCell} />);
                } else if (dayCounter > daysInMonth) {
                    rowCells.push(<View key={`empty-end-${dayCounter}-${col}`} style={styles.dayCell} />);
                } else {
                    const dateString = formatDate(dayCounter);
                    const isSelected = selectedDate === dateString;
                    const dayNum = dayCounter;

                    rowCells.push(
                        <TouchableOpacity
                            key={dayNum}
                            style={[styles.dayCell, isSelected && styles.selectedDayCell]}
                            onPress={() => onDateSelect(dateString)}
                        >
                            <Text style={[styles.dayText, { color: colors.text }, isSelected && styles.selectedDayText]}>
                                {dayNum}
                            </Text>
                        </TouchableOpacity>
                    );
                    dayCounter++;
                }
            }
            grid.push(<View key={row} style={styles.row}>{rowCells}</View>);
            if (dayCounter > daysInMonth) break;
        }
        return grid;
    };

    return (
        <View style={styles.container}>
            {/* Header: Prev, Month Year, Next */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => changeMonth(-1)} style={[styles.navButton, { backgroundColor: colors.inputBackground }]}>
                    <Feather name="chevron-left" size={20} color={colors.textMuted} />
                </TouchableOpacity>
                <Text style={[styles.monthTitle, { color: colors.text }]}>{monthYearString}</Text>
                <TouchableOpacity onPress={() => changeMonth(1)} style={[styles.navButton, { backgroundColor: colors.inputBackground }]}>
                    <Feather name="chevron-right" size={20} color={colors.textMuted} />
                </TouchableOpacity>
            </View>

            {/* Days of Week */}
            <View style={styles.weekHeader}>
                {DAYS_OF_WEEK.map(day => (
                    <Text key={day} style={[styles.weekDayText, { color: colors.textMuted }]}>{day}</Text>
                ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.gridContainer}>
                {renderCalendarGrid()}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        paddingHorizontal: 8,
    },
    navButton: {
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F7F7F7',
        borderRadius: 14,
    },
    monthTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0A0C11',
    },
    weekHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    weekDayText: {
        width: '14.28%',
        textAlign: 'center',
        fontSize: 10,
        color: '#0A0C11B2',
        fontWeight: '500',
    },
    gridContainer: {
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    dayCell: {
        width: '14.28%',
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedDayCell: {
    },
    dayText: {
        fontSize: 14,
        color: '#0A0C11',
    },
    selectedDayText: {
        color: '#0E6F6A',
        fontWeight: '600',
    },
});
