import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontFamily: 'Helvetica'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        borderBottom: 1,
        paddingBottom: 10
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20
    },
    section: {
        marginBottom: 15
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5,
        backgroundColor: '#f0f0f0',
        padding: 5
    },
    row: {
        flexDirection: 'row',
        marginBottom: 5
    },
    label: {
        width: '40%',
        fontWeight: 'bold'
    },
    value: {
        width: '60%'
    },
    table: {
        marginTop: 10,
        width: '100%'
    },
    tableRow: {
        flexDirection: 'row',
        borderBottom: 1,
        borderColor: '#eeeeee',
        padding: 5
    },
    tableHeader: {
        backgroundColor: '#f0f0f0',
        fontWeight: 'bold'
    },
    tableCol: {
        width: '25%'
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10
    },
    totalLabel: {
        width: '70%',
        textAlign: 'right',
        paddingRight: 10,
        fontWeight: 'bold'
    },
    totalValue: {
        width: '30%',
        textAlign: 'right'
    },
    signature: {
        marginTop: 40,
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    footer: {
        marginTop: 30,
        fontSize: 10,
        textAlign: 'center',
        color: '#666666'
    }
});

const PayrollPDF = ({ employee, formData, calculations, companyInfo }) => {
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('fr-FR', options);
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <View>
                        <Text>{companyInfo.name}</Text>
                        <Text>{companyInfo.address}</Text>
                        <Text>Tél: {companyInfo.phone}</Text>
                        <Text>Email: {companyInfo.email}</Text>
                    </View>
                    <View>
                        <Text>BULLETIN DE SALAIRE</Text>
                        <Text>Période: {formatDate(formData.periode.du)} au {formatDate(formData.periode.au)}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Informations Employé</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Nom:</Text>
                        <Text style={styles.value}>{employee.nom}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Prénom:</Text>
                        <Text style={styles.value}>{employee.prenom}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Poste:</Text>
                        <Text style={styles.value}>{employee.poste}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Matricule:</Text>
                        <Text style={styles.value}>{employee.matricule}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Date d'embauche:</Text>
                        <Text style={styles.value}>{formatDate(employee.dateEmbauche)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Catégorie:</Text>
                        <Text style={styles.value}>{employee.categorie}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Type de contrat:</Text>
                        <Text style={styles.value}>{employee.typeContrat}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Rémunération</Text>
                    <View style={styles.table}>
                        <View style={[styles.tableRow, styles.tableHeader]}>
                            <Text style={styles.tableCol}>Libellé</Text>
                            <Text style={styles.tableCol}>Montant (XOF)</Text>
                        </View>
                        <View style={styles.tableRow}>
                            <Text style={styles.tableCol}>Salaire de base</Text>
                            <Text style={styles.tableCol}>{formatCurrency(parseFloat(formData.remuneration.salaireBase))}</Text>
                        </View>
                        {parseFloat(formData.remuneration.sursalaire) > 0 && (
                            <View style={styles.tableRow}>
                                <Text style={styles.tableCol}>Sursalaire</Text>
                                <Text style={styles.tableCol}>{formatCurrency(parseFloat(formData.remuneration.sursalaire))}</Text>
                            </View>
                        )}
                        {parseFloat(formData.remuneration.indemniteDeplacement) > 0 && (
                            <View style={styles.tableRow}>
                                <Text style={styles.tableCol}>Indemnité de déplacement</Text>
                                <Text style={styles.tableCol}>{formatCurrency(parseFloat(formData.remuneration.indemniteDeplacement))}</Text>
                            </View>
                        )}
                        {parseFloat(formData.remuneration.autresIndemnites) > 0 && (
                            <View style={styles.tableRow}>
                                <Text style={styles.tableCol}>Autres indemnités</Text>
                                <Text style={styles.tableCol}>{formatCurrency(parseFloat(formData.remuneration.autresIndemnites))}</Text>
                            </View>
                        )}
                        {parseFloat(formData.remuneration.avantagesNature) > 0 && (
                            <View style={styles.tableRow}>
                                <Text style={styles.tableCol}>Avantages en nature</Text>
                                <Text style={styles.tableCol}>{formatCurrency(parseFloat(formData.remuneration.avantagesNature))}</Text>
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Primes et Indemnités</Text>
                    <View style={styles.table}>
                        <View style={[styles.tableRow, styles.tableHeader]}>
                            <Text style={styles.tableCol}>Libellé</Text>
                            <Text style={styles.tableCol}>Montant (XOF)</Text>
                        </View>
                        <View style={styles.tableRow}>
                            <Text style={styles.tableCol}>Indemnité de transport</Text>
                            <Text style={styles.tableCol}>{formatCurrency(parseFloat(formData.primes.transport))}</Text>
                        </View>
                        <View style={styles.tableRow}>
                            <Text style={styles.tableCol}>Prime de panier</Text>
                            <Text style={styles.tableCol}>{formatCurrency(parseFloat(formData.primes.panier))}</Text>
                        </View>
                        <View style={styles.tableRow}>
                            <Text style={styles.tableCol}>Indemnité de responsabilité</Text>
                            <Text style={styles.tableCol}>{formatCurrency(parseFloat(formData.primes.responsabilite))}</Text>
                        </View>
                        <View style={styles.tableRow}>
                            <Text style={styles.tableCol}>Autres primes</Text>
                            <Text style={styles.tableCol}>{formatCurrency(parseFloat(formData.primes.autresPrimes))}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Retenues</Text>
                    <View style={styles.table}>
                        <View style={[styles.tableRow, styles.tableHeader]}>
                            <Text style={styles.tableCol}>Libellé</Text>
                            <Text style={styles.tableCol}>Montant (XOF)</Text>
                        </View>
                        <View style={styles.tableRow}>
                            <Text style={styles.tableCol}>Retenue IPM</Text>
                            <Text style={styles.tableCol}>{formatCurrency(parseFloat(formData.retenues.ipm))}</Text>
                        </View>
                        <View style={styles.tableRow}>
                            <Text style={styles.tableCol}>Avances</Text>
                            <Text style={styles.tableCol}>{formatCurrency(parseFloat(formData.retenues.avances))}</Text>
                        </View>
                        <View style={styles.tableRow}>
                            <Text style={styles.tableCol}>TRIMF</Text>
                            <Text style={styles.tableCol}>{formatCurrency(parseFloat(formData.retenues.trimf))}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Calculs</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Brut Social:</Text>
                        <Text style={styles.value}>{formatCurrency(calculations.brutSocial)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Brut Fiscal:</Text>
                        <Text style={styles.value}>{formatCurrency(calculations.brutFiscal)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Cotisations Salariales:</Text>
                        <Text style={styles.value}>{formatCurrency(calculations.cotisationsSalariales)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Cotisations Patronales:</Text>
                        <Text style={styles.value}>{formatCurrency(calculations.cotisationsPatronales)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Salaire Net:</Text>
                        <Text style={styles.value}>{formatCurrency(calculations.salaireNet)}</Text>
                    </View>
                    <View style={[styles.row, { backgroundColor: '#f0f0f0', padding: 5 }]}>
                        <Text style={[styles.label, { fontWeight: 'bold' }]}>Salaire Net à Payer:</Text>
                        <Text style={[styles.value, { fontWeight: 'bold' }]}>{formatCurrency(calculations.salaireNetAPayer)}</Text>
                    </View>
                </View>

                <View style={styles.signature}>
                    <View>
                        <Text>L'Employeur</Text>
                        <Text>_________________________</Text>
                    </View>
                    <View>
                        <Text>L'Employé</Text>
                        <Text>_________________________</Text>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text>{companyInfo.name} - RC: {companyInfo.rc} - NINEA: {companyInfo.ninea}</Text>
                    <Text>Tél: {companyInfo.phone} - Email: {companyInfo.email}</Text>
                </View>
            </Page>
        </Document>
    );
};

export default PayrollPDF;