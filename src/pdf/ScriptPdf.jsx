import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { PDF_COLORS, PDF_PAGE_PADDING } from './pdfTheme.js'
import PdfHeader from './PdfHeader.jsx'

const styles = StyleSheet.create({
  page: {
    padding: PDF_PAGE_PADDING,
    backgroundColor: PDF_COLORS.page,
    fontFamily: 'Helvetica',
    fontSize: 10.5,
    color: PDF_COLORS.text,
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: PDF_COLORS.text,
    marginBottom: 12,
    paddingBottom: 6,
    borderBottom: `2px solid ${PDF_COLORS.accent}`,
  },
  subSection: {
    backgroundColor: PDF_COLORS.surface,
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
  },
  subSectionTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: PDF_COLORS.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  subSectionContent: {
    fontSize: 10.5,
    lineHeight: 1.5,
    color: PDF_COLORS.textDim,
  },
  empty: {
    fontSize: 10,
    color: PDF_COLORS.textFaint,
    fontStyle: 'italic',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 8,
    color: PDF_COLORS.textFaint,
  },
})

export default function ScriptPdf({ projectName, script }) {
  return (
    <Document title={`${projectName} — Script`}>
      <Page size="A4" style={styles.page}>
        <PdfHeader projectName={projectName} docTitle="Script" />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Variantes d'introduction</Text>
          {script.introVariants.map((sub) => (
            <View key={sub.id} style={styles.subSection}>
              <Text style={styles.subSectionTitle}>{sub.title}</Text>
              {sub.content ? (
                <Text style={styles.subSectionContent}>{sub.content}</Text>
              ) : (
                <Text style={styles.empty}>Pas encore rédigé.</Text>
              )}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tronc commun</Text>
          {script.commonTrunk.map((sub) => (
            <View key={sub.id} style={styles.subSection}>
              <Text style={styles.subSectionTitle}>{sub.title}</Text>
              {sub.content ? (
                <Text style={styles.subSectionContent}>{sub.content}</Text>
              ) : (
                <Text style={styles.empty}>Pas encore rédigé.</Text>
              )}
            </View>
          ))}
        </View>

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        />
      </Page>
    </Document>
  )
}
