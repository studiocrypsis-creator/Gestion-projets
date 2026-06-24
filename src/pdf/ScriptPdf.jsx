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
  // No wrapping View around each section's title+cards: react-pdf's
  // paginator mis-measures the *second* such sibling wrapper and pushes its
  // entire content to the next page even when the current page still has
  // plenty of room. Spacing between sections is done with marginTop on the
  // title instead, so titles/cards stay flat siblings that paginate per-card.
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: PDF_COLORS.text,
    marginTop: 22,
    marginBottom: 12,
    paddingBottom: 6,
    borderBottom: `2px solid ${PDF_COLORS.accent}`,
  },
  firstSectionTitle: {
    marginTop: 0,
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

        <Text style={[styles.sectionTitle, styles.firstSectionTitle]}>Variantes d'introduction</Text>
        {script.introVariants.map((sub) => (
          <View key={sub.id} style={styles.subSection} wrap={false}>
            <Text style={styles.subSectionTitle}>{sub.title}</Text>
            {sub.content ? (
              <Text style={styles.subSectionContent}>{sub.content}</Text>
            ) : (
              <Text style={styles.empty}>Pas encore rédigé.</Text>
            )}
          </View>
        ))}

        <Text style={styles.sectionTitle}>Tronc commun</Text>
        {script.commonTrunk.map((sub) => (
          <View key={sub.id} style={styles.subSection} wrap={false}>
            <Text style={styles.subSectionTitle}>{sub.title}</Text>
            {sub.content ? (
              <Text style={styles.subSectionContent}>{sub.content}</Text>
            ) : (
              <Text style={styles.empty}>Pas encore rédigé.</Text>
            )}
          </View>
        ))}

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        />
      </Page>
    </Document>
  )
}
