import { View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import { PDF_COLORS } from './pdfTheme.js'

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
    paddingBottom: 16,
    borderBottom: `1px solid ${PDF_COLORS.border}`,
  },
  // The logo PNG is a near-white wordmark designed for a dark header — on a
  // white PDF page it would be invisible, so it gets the same dark backdrop
  // chip already used for the web app's light theme (see .logo-chip in
  // index.css) instead of a different, inconsistent treatment.
  logoChip: {
    backgroundColor: PDF_COLORS.headerBg,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  logo: {
    height: 22,
    objectFit: 'contain',
  },
  meta: {
    alignItems: 'flex-end',
  },
  projectName: {
    fontSize: 13,
    fontWeight: 700,
    color: PDF_COLORS.text,
  },
  docTitle: {
    fontSize: 10,
    color: PDF_COLORS.accent,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  date: {
    fontSize: 8,
    color: PDF_COLORS.textFaint,
    marginTop: 2,
  },
})

export default function PdfHeader({ projectName, docTitle }) {
  const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  return (
    <View style={styles.header}>
      <View style={styles.logoChip}>
        <Image src="/logo.png" style={styles.logo} />
      </View>
      <View style={styles.meta}>
        <Text style={styles.projectName}>{projectName}</Text>
        <Text style={styles.docTitle}>{docTitle}</Text>
        <Text style={styles.date}>Exporté le {date}</Text>
      </View>
    </View>
  )
}
