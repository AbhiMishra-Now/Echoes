import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import './fonts'; // Import font registration

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FDFBF7',
    padding: 40,
    fontFamily: 'CormorantGaramond'
  },
  header: {
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 40,
    fontFamily: 'CinzelDecorative',
    color: '#D4AF37',
    letterSpacing: 2
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
    color: '#8B7355',
    textTransform: 'uppercase',
    letterSpacing: 3
  },
  spreadContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 30,
    justifyContent: 'center'
  },
  polaroid: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    paddingBottom: 35,
    width: '30%',
    minWidth: 200,
    marginBottom: 20
  },
  image: {
    width: '100%',
    height: 180,
    objectFit: 'cover',
    marginBottom: 12
  },
  caption: {
    fontSize: 11,
    textAlign: 'center',
    fontFamily: 'Caveat',
    color: '#2c1e16',
    lineHeight: 1.4
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 10,
    color: '#8B7355',
    borderTop: '1px solid #D4AF37',
    paddingTop: 10
  }
});

interface MemoryItem {
  id: string;
  imageUrl?: string;
  originalText: string;
  polishedCaption: string;
  activeVariant: 'original' | 'polished';
}

interface LegacyBookPDFProps {
  memories: MemoryItem[];
  chapterTitle: string;
  userName?: string;
}

export const LegacyBookPDF = ({ memories, chapterTitle, userName = 'Legacy Builder' }: LegacyBookPDFProps) => (
  <Document title={`${chapterTitle} - Echoes Legacy Book`} author={userName}>
    <Page size="A4" orientation="landscape" style={styles.page}>
      <Text style={styles.header}>{chapterTitle}</Text>
      <Text style={styles.subtitle}>Memoir Chapter Record</Text>
      
      <View style={styles.spreadContainer}>
        {memories.map((memory, index) => (
          <View 
            key={memory.id} 
            style={{
              ...styles.polaroid,
              transform: index % 2 === 0 ? 'rotate(-1deg)' : 'rotate(1deg)'
            }}
          >
            {memory.imageUrl && (
              <Image src={memory.imageUrl} style={styles.image} />
            )}
            <Text style={styles.caption}>
              {memory.activeVariant === 'original' 
                ? memory.originalText 
                : memory.polishedCaption}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.footer} fixed>
        <Text>© {new Date().getFullYear()} Echoes Legacy</Text>
        <Text>Preserving memories in magic</Text>
        <Text>Page 1 of 1</Text>
      </View>
    </Page>
  </Document>
);
